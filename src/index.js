import { Gateway } from "./core/gateway.js";
import { API } from "./core/API.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import EventEmitter from "events";

export const ActivityType = {
    PLAYING: 0,
    STREAMING: 1,
    LISTENING: 2,
    WATCHING: 3,
    CUSTOM: 4,
    COMPETING: 5,
};

export class SyncordClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        if (!this.options.applicationId) {
            throw new Error("Application ID is required in SyncordClient options.");
        }
        this.debug = options.debug ?? false;
        this.token = null;
        this.gateway = null;
        this.api = null;
        this.commands = new Map();
        this.guilds = new Map();
        this.commandPath = options.commandPath || "./commands";
        this.intents = Array.isArray(options.intents)
            ? options.intents.reduce((acc, bit) => acc | bit, 0)
            : (options.intents ?? 513);
    }

    get wsLatency() {
        return this.gateway?.latency ?? -1;
    }

    log(...args) {
        if (this.debug) {
            console.log("[Client]", ...args);
        }
    }

    async login(token) {
        this.token = token;
        this.gateway = new Gateway({ intents: this.intents, debug: this.debug }, token);
        this.api = new API(token, this.options);

        this.gateway.connect();

        this.gateway.on("READY", (data) => {
            this.user = {
                ...data.user,
                get tag() {
                    return `${this.username}#${this.discriminator}`;
                },
                setActivity: (name, { type = "WATCHING" } = {}) => {
                    this.gateway.sendPresenceUpdate({
                        activities: [{ name, type: ActivityType[type] ?? 3 }],
                        status: "online",
                        since: 0,
                        afk: false,
                    });
                },
            };
            this.emit("READY", this);
        });

        this.gateway.on("GUILD_CREATE", (guild) => {
            this.guilds.set(guild.id, guild);
        });

        this.gateway.on("MESSAGE_CREATE", (message) => {
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
                    return this.api.createMessage(message.channel_id, payload);
                },
            };
            this.emit("MESSAGE_CREATE", messageWrapper);
        });

        this.gateway.on("INTERACTION_CREATE", async (interaction) => {
            this.emit("INTERACTION_CREATE", interaction);       
            const interactionWrapper = {
                ...interaction,
                client: this,
                api: this.api,
                guild: this.guilds.get(interaction.guild_id),
                editReply: (response) => this.api.editReply(this.options.applicationId, interaction.token, response),
            };

            if (interaction.type === 2) {
                const command = this.commands.get(interaction.data.name);
                if (!command) return;

                interactionWrapper.reply = async (options) => {
                    const message = await this.api.reply(interaction.id, interaction.token, options);
                    return {
                        ...message,
                        editReply: (editOptions) => this.api.editReply(this.options.applicationId, interaction.token, editOptions),
                    };
                };
                interactionWrapper.deferReply = (ephemeral) => this.api.deferReply(interaction.id, interaction.token, ephemeral);

                try {
                    await command.execute(interactionWrapper);
                } catch (err) {
                    console.error("Error executing command:", err);
                    await interactionWrapper.editReply({ content: "❌ An error occurred while executing the command.", components: [] });
                }
            } else if (interaction.type === 3) { // Message Component
                interactionWrapper.update = (response) => this.api.updateMessage(interaction.id, interaction.token, response);
                interactionWrapper.deferUpdate = () => this.api.deferUpdate(interaction.id, interaction.token);
                interactionWrapper.reply = (response) => this.api.reply(interaction.id, interaction.token, response);
                this.emit("componentInteraction", interactionWrapper);
            }
        });
    }

    async loadCommands(folderPath = this.commandPath) {
        const absolutePath = path.resolve(folderPath);
        const files = fs.readdirSync(absolutePath).filter((f) => f.endsWith(".js"));
        for (const file of files) {
            const fileURL = pathToFileURL(path.join(absolutePath, file)).href;
            const { default: command } = await import(fileURL);

            if (command?.data?.name && typeof command.execute === "function") {
                this.commands.set(command.data.name, command);
                this.log(`✅ Loaded command: ${command.data.name}`);

                if (typeof command.registerEvents === "function") {
                    command.registerEvents(this);
                }
            }
        }
    }

    async registerAllCommands() {
        this.log("Starting to register all commands globally...");
        for (const command of this.commands.values()) {
            try {
                await this.api.registerGlobalCommand(
                    this.options.applicationId,
                    command.data.name,
                    command.data.description,
                    command.data.options ?? []
                );
                this.log(`✅ Successfully registered command: ${command.data.name}`);
            } catch (err) {
                console.error(`❌ Failed to register command ${command.data.name}:`, err);
            }
        }
        this.log("Finished registering all commands.");
        return true;
    }
}