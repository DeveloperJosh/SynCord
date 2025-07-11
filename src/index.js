import { Gateway } from "./core/gateway.js";
import { API } from "./core/API.js";
import { registerEventListeners } from "./utils/eventHandler.js";
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
        this.ActivityType = ActivityType;
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
    /**
     * This is useful for scripts that only need to make API calls, like command registration.
     * @param {string} token - The bot's authentication token.
     */
    initAPI(token) {
        this.token = token;
        this.api = new API(token, this.options);
    }
    /**
     * Connects the bot to the Discord Gateway to begin receiving events.
     * @param {string} token - The bot's authentication token.
     */
    async login(token) {
        this.initAPI(token);
        this.gateway = new Gateway({ intents: this.intents, debug: this.debug }, token);
        this.gateway.connect();
        registerEventListeners(this);
    }
    /**
     * Loads command files from the specified directory into the client's command map.
     * @param {string} [folderPath=this.commandPath] - The path to the commands folder.
     */
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
    /**
     * Registers all loaded commands with Discord.
     * This should be run from a separate script, not on every bot startup.
     */
    async registerAllCommands() {
        if (!this.api) {
            throw new Error("API not initialized. Call client.initAPI(token) before registering commands.");
        }
        this.log("Starting to register all commands globally...");
        const commandData = Array.from(this.commands.values());

        try {
             await this.api.bulkRegisterGlobalCommands(
                 this.options.applicationId,
                 commandData.map(cmd => cmd.data) 
             );
             this.log(`✅ Successfully registered ${commandData.length} commands.`);
        } catch (err) {
             console.error(`❌ Failed to register commands in bulk:`, err);
        }
        return true;
    }
}