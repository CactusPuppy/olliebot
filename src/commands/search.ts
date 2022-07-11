import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";
import { setTimeout } from "node:timers/promises";
import Command from "./_command";

export default class Search extends Command {
  constructor() {
    super("search", "Search Workshop.codes for codes or wiki articles");
  }

  getJSONable() {
    const builder = super.getBaseCommandBuilder();
    return builder
      .addSubcommand(subcommand =>
        subcommand
          .setName("codes")
          .setDescription("Search for Workshop codes on Workshop.codes")
          .addStringOption(option => option.setName("query").setDescription("The thing to search for"))
          .addBooleanOption(option => option.setName("overwatch_2_only").setDescription("Whether to show only Overwatch 2 compatible codes"))
      ).addSubcommand(subcommand =>
        subcommand
          .setName("wiki")
          .setDescription("Search the Workshop.codes wiki")
          .addStringOption(option => option.setName("query").setDescription("The thing to search for"))
      );
  }

  async run(interaction: CommandInteraction<CacheType>): Promise<boolean> {
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    if (query == null || query === "") {
      await interaction.reply("Search terms are required.");
      return false;
    }
    switch (interaction.options.getSubcommand()) {
      case "codes":
        break;
      case "wiki":
        break;
      default:
        return false;
    }
    return true;
  }
}
