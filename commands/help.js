import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { EmbedBuilder } from "../src/utils/EmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all available commands.')
        .toJSON(),

    async execute(interaction) {
        const commands = interaction.client.commands;

        const commandList = Array.from(commands.values())
            .map(cmd => `**/${cmd.data.name}**\n*${cmd.data.description}*`)
            .join('\n\n');

        const helpEmbed = new EmbedBuilder()
            .setTitle('Help - Command List')
            //.setDescription(commandList)
            // make a field for each command
            .addFields(
                ...Array.from(commands.values()).map(cmd => ({
                    name: `/${cmd.data.name}`,
                    value: cmd.data.description || 'No description available',
                    inline: false
                }))
            )
            .setColor(0x5865F2)
            .setFooter(`Found ${commands.size} commands.`)
            .setTimestamp();

        try {
            await interaction.reply({
                embeds: [helpEmbed.toJSON()],
                ephemeral: true
            });
        } catch (err) {
            console.error("Error sending help command reply:", err);
        }
    }
};