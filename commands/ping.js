import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with bot latency!')
        .toJSON(),

    async execute(interaction) {
        const response = await interaction.reply({
            content: 'Pinging...',
            ephemeral: true,
        });
        const apiLatency = interaction.client.wsLatency;

        await response.editReply({
            content: `🏓 **Pong!**\n**API Latency:** \`${apiLatency}ms\``
        });
    }
};