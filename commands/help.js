// In commands/help.js

import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { EmbedBuilder } from "../src/utils/EmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all available commands.')
        .toJSON(),

    async execute({ reply, client }) {
        // Access the command map from the client instance
        const commands = client.commands;

        const commandList = Array.from(commands.values())
            .map(cmd => `**/${cmd.data.name}**\n*${cmd.data.description}*`)
            .join('\n\n');

        // Use the EmbedBuilder to create the response
        const helpEmbed = new EmbedBuilder()
            .setTitle('Help - Command List')
            .setDescription(commandList)
            .setColor(0x5865F2) // Discord's "Blurple" color
            .setFooter(`Found ${commands.size} commands.`)
            .setTimestamp();

        // Reply to the interaction with the embed
        try {
            await reply({
                embeds: [helpEmbed.toJSON()],
                ephemeral: true 
            });
        } catch (err) {
            console.error("Error sending help command reply:", err);
        }
    }
};