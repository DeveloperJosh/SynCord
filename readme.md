
# SynCord

SynCord is a simple Discord framework that is in early beta,
SynCord Will be just like most framework's but you will learn more about the discord api it's self.


## Exp

```js
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
    if (message.content == "ping") {
        bot.send_embed(message.channel_id, [
            {
                "title": "Embed Title", 
                "description": "Embed Description",
                "color": 0x00ff00
            }
        ]);
    }
});

bot.event("INTERACTION_CREATE", (interaction) => {
    if (interaction.type == 2) {
        if (interaction.data.name == "ping") {
            bot.interaction_response_embed(interaction.id, interaction.token, [
                {
                    "title": "Embed Title",
                    "description": "Embed Description",
                    "color": 0x00ff00
                }
            ],
            false);
        }
    }
});

bot.start(process.env.TOKEN);
```
