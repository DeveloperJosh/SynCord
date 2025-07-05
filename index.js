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
  applicationId: process.env.APP_ID,
});

client.on("READY", (data) => {
  console.log(`Logged in as ${data.user.username} (${data.user.id})`);
  console.log(`Logged in as ${data.tag}`);
  
  data.user.setActivity("Overwatch", { type: "COMPETING" });
});

await client.loadCommands();
await client.login(process.env.TOKEN);
//await client.registerAllCommands();
