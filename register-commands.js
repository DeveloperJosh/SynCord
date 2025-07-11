import { SyncordClient } from './src/index.js'; 
import 'dotenv/config';

const token = process.env.TOKEN;
const applicationId = process.env.APP_ID;
const commandPath = './commands';

if (!token || !applicationId) {
    console.error("❌ Error: Please set TOKEN and APP_ID in your .env file.");
    process.exit(1);
}

const register = async () => {
    console.log("Initializing client for command registration...");
    const client = new SyncordClient({
        applicationId: applicationId,
        commandPath: commandPath,
    });
    client.initAPI(token);

    await client.loadCommands();

    if (client.commands.size > 0) {
        await client.registerAllCommands();
    } else {
        console.log("No commands found to register.");
    }
    console.log("Registration script finished.");
};

register().catch(console.error);