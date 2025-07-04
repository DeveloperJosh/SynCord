import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { ButtonBuilder } from "../src/utils/ButtonBuilder.js";
import { ActionRowBuilder } from "../src/utils/ActionRowBuilder.js";

export default {
    data: new SlashCommandBuilder()
        .setName("button")
        .setDescription("Sends a clickable button")
        .toJSON(),
    async execute(interaction) {
        const button = new ButtonBuilder()
            .setLabel("Click me!")
            .setStyle(1) 
            .setCustomId("btn_click");

        const row = new ActionRowBuilder().addButton(button);

        await interaction.reply({
            content: "Here’s your button 👇",
            components: [row.toJSON()],
        });
    },

    registerEvents(client) {
        client.on("componentInteraction", async (interaction) => {
            if (interaction.data.custom_id !== "btn_click") {
                return;
            }

            try {
                await interaction.deferUpdate();
                await interaction.editReply({
                    content: "You clicked the button! 🎉",
                    components: [],
                });
            } catch (err) {
                console.error("Error handling button interaction:", err);
            }
        });
    },
};