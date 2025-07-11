import { SyncordClient, ActivityType } from "./src/index.js"; 
import { GatewayIntentBits as Intents } from "./src/utils/GatewayIntentBits.js";
import dotenv from "dotenv";
dotenv.config();

const main = async () => {
    try {
        const client = new SyncordClient({
            intents: [
                Intents.GUILDS,
                Intents.GUILD_MESSAGES,
                Intents.GUILD_MESSAGE_REACTIONS,
                Intents.MESSAGE_CONTENT,
            ],
            commandPath: "./commands",
            debug: false, 
            applicationId: process.env.APP_ID,
        });

        client.on("READY", (data) => {
            console.log(`Logged in as ${data.user.username} (${data.user.id})`);
            
            data.user.setActivity("The discord race", { type: ActivityType.COMPETING });
        });
        await client.loadCommands();
        await client.login(process.env.TOKEN);

    } catch (error) {
        console.error("❌ An error occurred during bot startup:", error);
        process.exit(1);
    }
};

main().catch(console.error);