import SynCord from "./src/syncord.js";
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new SynCord({ intents: 513, game: "SynCord", status: "dnd" });

bot.event("READY", (data) => {
    console.log(`Logged in as ${data.user.username}`);
    ///bot.register_guild(data.user.id, 951303456650580058n, "ping", "ping command");
});

bot.event("MESSAGE_CREATE", (message) => {
    if (message.author.bot) return;
    let args = message.content.split(" ");
    let command = args.shift();
    let prefix = "!";
    if (command.startsWith(prefix)) {
        command = command.slice(prefix.length);
        if (command === "ping") {
            bot.send(message.channel_id, "Pong!");
        }
        // make channel
        if (command === "makechannel") {
            let name = args[0];
            channel=  bot.create_channel(message.guild_id, name, 0);

            bot.send(message.channel_id, `Created channel ${name}`);
        }
        // delete channel
        if (command === "deletechannel") {
            let name = args[0];
            channel=  bot.delete_channel(message.guild_id, name);

            bot.send(message.channel_id, `Deleted channel ${name}`);
        }
        if (command === "help") {
            let embed = {
                title: "Help",
                description: "This is a help embed",
                color: 0x00ff00,
                fields: [
                    {
                        name: "ping",
                        value: "Pong!"
                    },
                    {
                        name: "makechannel",
                        value: "Makes a channel"
                    },
                    {
                        name: "deletechannel",
                        value: "Deletes a channel"
                    },
                ]
            }
            bot.send_embed(message.channel_id, [
                embed
            ]);
        }
     }
 });

bot.start(process.env.TOKEN);