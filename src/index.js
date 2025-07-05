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

    async login(token) {
        this.token = token;
        this.gateway = new Gateway({ intents: this.intents, debug: this.debug }, token);
        this.api = new API(token, this.options);

        this.gateway.connect();
        registerEventListeners(this);
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