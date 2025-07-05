import { Permissions } from "./Permissions.js";

function handleInteractionCreate(client, interaction) {
    const interactionWrapper = {
        ...interaction,
        client: client,
        api: client.api,
        guild: client.guilds.get(interaction.guild_id),
        editReply: (response) => client.api.editReply(client.options.applicationId, interaction.token, response),
    };

    switch (interaction.type) {
        case 2: { // Application Command
            const command = client.commands.get(interaction.data.name);
            if (!command) return;

            interactionWrapper.reply = async (options) => {
                const message = await client.api.reply(interaction.id, interaction.token, options);
                return {
                    ...message,
                    editReply: (editOptions) => client.api.editReply(client.options.applicationId, interaction.token, editOptions),
                };
            };
            interactionWrapper.deferReply = (ephemeral) => client.api.deferReply(interaction.id, interaction.token, ephemeral);

            if (command.data.default_member_permissions) {
                const memberPermissions = new Permissions(interaction.member.permissions);
                const requiredPermissions = new Permissions(command.data.default_member_permissions);

                if (!memberPermissions.has(BigInt(requiredPermissions.bits))) {
                    return interactionWrapper.reply({
                        content: '❌ You do not have the required permissions to use this command.',
                        ephemeral: true
                    });
                }
            }

            try {
                command.execute(interactionWrapper);
            } catch (err) {
                console.error("Error executing command:", err);
                interactionWrapper.editReply({ content: "❌ An error occurred while executing the command.", components: [] }).catch(console.error);
            }
            break;
        }
        
        case 3: { // Component Interaction
            interactionWrapper.update = (response) => client.api.updateMessage(interaction.id, interaction.token, response);
            interactionWrapper.deferUpdate = () => client.api.deferUpdate(interaction.id, interaction.token);
            interactionWrapper.reply = (response) => client.api.reply(interaction.id, interaction.token, response);
            client.emit("componentInteraction", interactionWrapper);
            break;
        }

        default:
            client.log(`Received unhandled interaction type: ${interaction.type}`);
            break;
    }
}

export function registerEventListeners(client) {
    const { gateway } = client;

    gateway.on("READY", (data) => {
        client.user = {
            ...data.user,
            setActivity: (name, { type = "WATCHING" } = {}) => {
                client.gateway.sendPresenceUpdate({
                    activities: [{ name, type: client.ActivityType[type] ?? 3 }],
                    status: "online",
                    since: 0,
                    afk: false,
                });
            },
        };
        client.emit("READY", client);
    });

    gateway.on("GUILD_CREATE", (guild) => {
        client.guilds.set(guild.id, guild);
        client.emit("GUILD_CREATE", guild);
    });
    
    gateway.on("GUILD_DELETE", (guild) => {
        if (client.guilds.has(guild.id)) {
            client.guilds.delete(guild.id);
        }
        client.emit("GUILD_DELETE", guild);
    });

    gateway.on("MESSAGE_CREATE", (message) => {
        const messageWrapper = {
            ...message,
            reply: (options) => {
                let payload = {};
                if (typeof options === 'string') {
                    payload.content = options;
                } else {
                    payload = { ...options };
                }
                payload.message_reference = { message_id: message.id };
                if (!payload.allowed_mentions) {
                    payload.allowed_mentions = { replied_user: false };
                }
                return client.api.createMessage(message.channel_id, payload);
            },
        };
        client.emit("MESSAGE_CREATE", messageWrapper);
    });

    gateway.on("MESSAGE_UPDATE", (message) => client.emit("MESSAGE_UPDATE", message));
    gateway.on("MESSAGE_DELETE", (payload) => client.emit("MESSAGE_DELETE", payload));
    gateway.on("CHANNEL_CREATE", (channel) => client.emit("CHANNEL_CREATE", channel));
    gateway.on("CHANNEL_DELETE", (channel) => client.emit("CHANNEL_DELETE", channel));

    gateway.on("AUTO_MODERATION_RULE_CREATE", (payload) => client.emit("AUTO_MODERATION_RULE_CREATE", payload));
    gateway.on("AUTO_MODERATION_RULE_UPDATE", (payload) => client.emit("AUTO_MODERATION_RULE_UPDATE", payload));
    gateway.on("AUTO_MODERATION_RULE_DELETE", (payload) => client.emit("AUTO_MODERATION_RULE_DELETE", payload));
    gateway.on("AUTO_MODERATION_ACTION_EXECUTION", (payload) => client.emit("AUTO_MODERATION_ACTION_EXECUTION", payload));
    
    gateway.on("INTERACTION_CREATE", async (interaction) => {
        client.emit("INTERACTION_CREATE", interaction);
        handleInteractionCreate(client, interaction);
    });
}
