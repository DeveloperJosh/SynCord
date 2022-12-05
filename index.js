import SynCord from "./src/syncord.js";
import fs from "fs";
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new SynCord({ intents: 513, token: process.env.TOKEN, game: "It works", status: "dnd" });

bot.on("READY", (data) => {
    console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
});

fs.readdir("./commands", (err, files) => {
    if (err) console.log(err);
    let jsfiles = files.filter(f => f.split(".").pop() === "js");
    if (jsfiles.length <= 0) {
        console.log("No commands to load!");
        return;
    }
    console.log(`Loading a total of ${jsfiles.length} commands.`);
    jsfiles.forEach((f, i) => {
        let props = import(`./commands/${f}`);
        console.log(`${i + 1}: ${f} loaded!`);
    });
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