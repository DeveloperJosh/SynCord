
# SynCord

SynCord is a simple Discord framework that is in early beta,
SynCord Will be just like most framework's but you will learn more about the discord api it's self.


## Exp

```js
import { SyncordClient } from "./src/index.js";
import { GatewayIntentBits as Intents } from "./src/utils/GatewayIntentBits.js";
import dotenv from "dotenv";
dotenv.config();

const client = new SyncordClient({
  intents: [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.GUILD_MESSAGE_REACTIONS,
    Intents.MESSAGE_CONTENT,
  ],
  commandPath: "./commands",
  debug: true, 
});

client.on("READY", (data) => {
  console.log(`Logged in as ${data.user.username} (${data.user.id})`);
  data.user.setActivity("Sailor Song by Gigi Perez", { type: "LISTENING" });
});

client.on("MESSAGE_CREATE", (msg) => {
  console.log(`[MSG] ${msg.author.username}: ${msg.content}`);
});

client.on("INTERACTION_CREATE", (interaction) => {
  console.log(
    `[INT] ${interaction.data?.name || interaction.data?.custom_id || "unknown"}`
  );
});

await client.loadCommands();
await client.login(process.env.TOKEN);
await client.registerAllCommands(process.env.APP_ID);
```
