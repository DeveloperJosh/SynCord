import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { PermissionFlags } from "../src/utils/Permissions.js";

export default {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to send a DM to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .setDefaultMemberPermissions(String(PermissionFlags.BanMembers))
        .toJSON(),

    async execute(interaction) {
        const options = interaction.data.options;
        const targetOption = options.find(opt => opt.name === 'target');
        const messageOption = options.find(opt => opt.name === 'message');

        const targetId = targetOption.value;
        const message = messageOption.value;

        const targetUser = interaction.data.resolved.users[targetId];

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ You cannot send DMs to bots.',
                ephemeral: true
            });
        }

        try {
            const dmContent = `You have received a message from the staff of **${interaction.guild.name}**:\n\n> ${message}`;
            
            await interaction.client.api.createDmMessage(targetId, dmContent);

            return interaction.reply({
                content: `✅ Successfully sent a DM to ${targetUser.username}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error sending DM:', error);
            return interaction.reply({
                content: '❌ Failed to send DM. The user may have DMs disabled or an error occurred.',
                ephemeral: true
            });
        }
    }
};
