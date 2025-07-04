import { SlashCommandBuilder } from "../src/utils/SlashCommandBuilder.js";
import { EmbedBuilder } from "../src/utils/EmbedBuilder.js";

export default {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replies with your input!")
    .addStringOption((opt) =>
      opt.setName("text").setDescription("The text to echo back").setRequired()
    )
    .toJSON(),

  async execute({ reply, data }) {
    const text = data.options.find((o) => o.name === "text")?.value;
    const embed = new EmbedBuilder()
      .setTitle("Echo")
      .setDescription(`You said: ${text}`)
      .setColor("#00FF00")
      .setTimestamp()
      .setFooter("Echo Command");

    await reply({
      content: null,
      embeds: [embed.toJSON()],
    });
  },
};
