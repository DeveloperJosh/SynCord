import { Permissions } from "./Permissions.js";

/**
 * A standalone helper function to construct a Discord avatar URL.
 * @param {object} user - The user object from Discord.
 * @param {object} [member] - The member object from Discord.
 * @param {string} [guildId] - The ID of the guild.
 * @param {object} [options] - Options for the avatar URL.
 * @param {string} [options.format='png'] - The format of the image (png, jpg, webp, gif).
 * @param {number} [options.size=1024] - The size of the image (any power of 2 from 16 to 4096).
 * @param {boolean} [options.dynamic=false] - If true, will use GIF for animated avatars.
 * @returns {string} The full URL of the user's avatar.
 */
function getDisplayAvatarURL(user, member, guildId, { format = 'png', size = 1024, dynamic = false } = {}) {
    if (!user) {
        return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
    let avatarHash = user.avatar;
    let isGuildAvatar = false;

    if (member && member.avatar) {
        avatarHash = member.avatar;
        isGuildAvatar = true;
    }
    
    let imageFormat = format;
    if (dynamic && avatarHash && avatarHash.startsWith('a_')) {
        imageFormat = 'gif';
    }

    if (avatarHash) {
        if (isGuildAvatar) {
            if (guildId) {
                return `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${avatarHash}.${imageFormat}?size=${size}`;
            }
            // Fallback to user avatar if guildId is not provided
            return `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.${imageFormat}?size=${size}`;
        }
        return `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.${imageFormat}?size=${size}`;
    }

    const discriminator = user.discriminator || '0';
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;
}

function handleInteractionCreate(client, interaction) {
    const user = interaction.member ? interaction.member.user : interaction.user;

    const interactionWrapper = {
        ...interaction,
        client: client,
        api: client.api,
        guild: client.guilds.get(interaction.guild_id),
        user: user,
        member: interaction.member,
        editReply: (response) => client.api.editReply(client.options.applicationId, interaction.token, response),
        getDisplayAvatarURL: (u, m, options) => getDisplayAvatarURL(u, m, interaction.guild_id, options),
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

            if (command.data.default_member_permissions && interaction.member) {
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
                const replyFunction = interactionWrapper.editReply || interactionWrapper.reply;
                replyFunction({ content: "❌ An error occurred while executing the command.", components: [] }).catch(console.error);
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
        const clientUser = {
            ...data.user,
            /**
             * Sets the bot's presence and activity.
             * @param {string} name - The name of the activity (e.g., "Overwatch 2").
             * @param {object} [options] - Additional options for the presence.
             * @param {string|number} [options.type="PLAYING"] - The type of activity. Can be "PLAYING", "STREAMING", etc., or the corresponding number (0, 1, etc.).
             */
            setActivity: (name, { type = "PLAYING" } = {}) => {
                let activityCode;

                if (typeof type === 'string' && client.ActivityType.hasOwnProperty(type)) {
                    activityCode = client.ActivityType[type];
                } 
                else if (typeof type === 'number' && Object.values(client.ActivityType).includes(type)) {
                    activityCode = type;
                }

                if (activityCode === undefined) {
                    console.warn(`[Client] Invalid activity type "${type}". Defaulting to "PLAYING".`);
                    activityCode = 0; // ActivityType.PLAYING
                }
                
                client.gateway.sendPresenceUpdate({
                    activities: [{ name, type: activityCode }],
                    status: "online",
                    since: 0,
                    afk: false,
                });
            },
        };

        const clientData = {
            ...client,
            user: clientUser,
        };

        client.user = clientUser;
        client.emit("READY", clientData);
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