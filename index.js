import SynCord from "./src/syncord.js";
import fs from "fs";
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new SynCord({ intents: 513, token: process.env.TOKEN, game: "It works", status: "dnd" });

bot.on("READY", (data) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
});

bot.on("MESSAGE_CREATE", (data) => {
    //read files in commands folder and register them as commands
});

// interactions event
bot.on("INTERACTION_CREATE", (data) => {
    if (data.data.name == "status") {
        bot.send_interaction_response(data.id, data.token, "Online", false);
    }
});

bot.start();