import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { EmbedBuilder } from "../src/utils/EmbedBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about the user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false))
        .toJSON(),

    async execute(interaction) {
        try {
            const userOption = interaction.data.options?.find(opt => opt.name === 'user');

            const targetUser = userOption
                ? interaction.data.resolved.users[userOption.value]
                : interaction.user;

            const targetMember = userOption
                ? interaction.data.resolved.members?.[userOption.value]
                : interaction.member;

            if (!targetUser) {
                return interaction.reply({ content: '❌ User not found.', ephemeral: true });
            }
            
            const getCreatedAt = (userId) => {
                const timestamp = (BigInt(userId) >> 22n) + 1420070400000n;
                return new Date(Number(timestamp));
            };

            const createdAt = getCreatedAt(targetUser.id);
            
            const avatarURL = interaction.getDisplayAvatarURL(targetUser, targetMember, { dynamic: true });

            const userInfoEmbed = new EmbedBuilder()
                .setTitle(`${targetUser.username}'s Information`)
                .setThumbnail(avatarURL)
                .addFields(
                    { name: 'Username', value: targetUser.username, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Bot?', value: targetUser.bot ? 'Yes' : 'No', inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`, inline: false }
                )
                .setColor(0x5865F2)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.getDisplayAvatarURL(interaction.user, interaction.member, { dynamic: true }))
                .setTimestamp()
                .toJSON();
                
            await interaction.reply({
                embeds: [userInfoEmbed],
                ephemeral: true
            });

        } catch (err) {
            console.error("Error executing userinfo command:", err);
            if (interaction.replied) {
                await interaction.editReply({
                    content: '❌ An error occurred while fetching user information.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while fetching user information.',
                    ephemeral: true
                });
            }
        }
    }
};