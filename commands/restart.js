import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { PermissionFlags } from "../src/utils/Permissions.js";

export default {
    data: new SlashCommandBuilder()
        .setName('reconnect')
        .setDescription('Forces the bot to disconnect and attempt to resume its session.')
        .setDefaultMemberPermissions(String(PermissionFlags.Administrator))
        .toJSON(),

    /**
     * Executes the reconnect command.
     * @param {object} interaction - The interaction wrapper object from the event handler.
     */
    async execute(interaction) {
        const client = interaction.client;

        await interaction.reply({
            content: '✅ Forcing gateway reconnect... Watch the console for logs.',
            ephemeral: true
        });

        console.log(`[Reconnect Command] Triggered by ${interaction.member.user.username}. Closing connection...`);

        if (client && client.gateway && client.gateway.ws) {
            client.gateway.ws.close(4000);
        } else {
            console.error('[Reconnect Command] Could not find client.gateway.ws to close.');
        }
    }
};
