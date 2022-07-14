import { CacheType, CommandInteraction, MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import { bold, time } from "@discordjs/builders";
import { parseISO } from "date-fns";
import winston from "winston";
import Command from "./_command";
import { wscPost, wscWikiArticle } from "../global";

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
          .addStringOption(option => option.setName("query").setDescription("The thing to search for").setRequired(true))
          .addBooleanOption(option => option.setName("overwatch_2_only").setDescription("Whether to show only Overwatch 2 compatible codes"))
      ).addSubcommand(subcommand =>
        subcommand
          .setName("wiki")
          .setDescription("Search the Workshop.codes wiki")
          .addStringOption(option => option.setName("query").setDescription("The thing to search for").setRequired(true))
      );
  }

  async run(interaction: CommandInteraction<CacheType>): Promise<boolean> {
    await interaction.deferReply();
    let query = interaction.options.getString("query");
    if (query == null || query === "") {
      await interaction.reply("Search terms are required.");
      return false;
    }
    // HACK: Replace dots with spaces to avoid confusing the WSC router
    query = query.replace(".", " ");
    switch (interaction.options.getSubcommand()) {
      case "codes": {
        // Set up search URL
        const searchURL = new URL("https://workshop.codes/");
        /* Add options for maps and whatever here

        Order:
        (categories/:category)/(heroes/:hero)/(maps/:map)/(from/:from)/(to/:to)/(exclude-expired/:expired)/(overwatch-2/:overwatch_2)/(author/:author)/(players/:players)
        */
        if (interaction.options.getBoolean("overwatch_2_only")) {
          searchURL.pathname += "/overwatch-2/true";
        }

        searchURL.pathname += `/search/${encodeURIComponent(query)}.json`;

        // Execute the search
        const response = await fetch(searchURL.toString()).catch(reason => {
          winston.error(`Failed to contact Workshop.codes: ${reason}`);
          interaction.editReply("I'm having trouble reaching Workshop.codes right now. Sorry about that!");
        });
        if (response == null) break;
        if (!response.ok) {
          winston.error(`Workshop.codes responded with code ${response.status} - ${response.statusText}\nSearched for: \`${searchURL.pathname}\``);
          interaction.editReply("I'm having trouble talking to Workshop.codes right now. Sorry about that!");
          break;
        }
        let data = await response.json().catch(reason => {
          winston.error(`Failed to parse Workshop.codes response: ${reason}`);
          interaction.editReply("I'm having trouble understanding what Workshop.codes sent back to me. Sorry about that!");
        });
        if (data == null) break;

        // Process the data
        if (!Array.isArray(data)) {
          winston.error(`Expected array from Workshop.codes, got ${typeof data} instead`);
          interaction.editReply("I'm having trouble understanding what Workshop.codes sent back to me. Sorry about that!");
          break;
        }
        if ((<wscPost[]>data).length === 0) {
          interaction.editReply("I didn't find anything on Workshop.codes.");
          return true;
        }
        // Only include first three results
        /* TODO: In the future, maybe have a button interaction to page to next results
            instead of just listing first 3? */
        if ((<wscPost[]>data).length > 3) {
          data = (data as wscPost[]).slice(0,3);
        }
        // Show the results
        const embeds = (data as wscPost[]).map((post) => {
          // Humanize last updated and last created date
          const lastUpdate = time(parseISO(post.last_revision_created_at), "R");
          const created = time(parseISO(post.created_at), "D");

          // Create and send the embed
          const embed = new MessageEmbed()
            .setTitle(`${post.title} by ${post.user.username}`)
            .setURL(`https://workshop.codes/${post.code}`)
            .setThumbnail(post.thumbnail)
            .setColor("#3fbf74")
            .setDescription(`Code: ${bold(post.code)}`)
            .addField(
              post.categories.length <= 1
                ? "Category"
                : "Categories",
              `${post.categories.join(" | ")}`,
              true
            )
            .addField("Created", created, true)
            .addField("Last updated", lastUpdate, true)
            .setFooter({
              text: "workshop.codes | Powered by Elo Hell Esports",
              iconURL: "https://ehe.gg/media/img/logos/Elo-Hell-Logo_I-C-Dark.png"
            });
          return embed;
        });
        await interaction.editReply({
          content: "Here's what I found!",
          embeds: embeds
        });
        break;
      }
      case "wiki": {
        // TODO: Put repeated code into a function
        // Set up search URL
        const searchURL = new URL(`https://workshop.codes/wiki/search/${encodeURIComponent(query)}.json`);

        // Execute the search
        const response = await fetch(searchURL.toString()).catch(reason => {
          winston.error(`Failed to contact Workshop.codes: ${reason}`);
          interaction.editReply("I'm having trouble reaching Workshop.codes right now. Sorry about that!");
        });
        if (response == null) break;
        if (!response.ok) {
          winston.error(`Workshop.codes responded with code ${response.status} - ${response.statusText}\nSearched for: \`${searchURL.pathname}\``);
          interaction.editReply("I'm having trouble talking to Workshop.codes right now. Sorry about that!");
          break;
        }
        let data = await response.json().catch(reason => {
          winston.error(`Failed to parse Workshop.codes response: ${reason}`);
          interaction.editReply("I'm having trouble understanding what Workshop.codes sent back to me. Sorry about that!");
        });
        if (data == null) break;

        // Process the data
        if (!Array.isArray(data)) {
          winston.error(`Expected array from Workshop.codes, got ${typeof data} instead`);
          interaction.editReply("I'm having trouble understanding what Workshop.codes sent back to me. Sorry about that!");
          break;
        }
        if ((<wscWikiArticle[]>data).length === 0) {
          interaction.editReply("I didn't find anything like that on the Workshop.codes wiki.");
          return true;
        }
        // Only include first result
        /* TODO: In the future, maybe have a button interaction to page to next results
            instead of just listing first? */
        if ((<wscWikiArticle[]>data).length > 1) {
          data = (data as wscWikiArticle[]).slice(0,1);
        }
        // Show the results
        const embeds = (data as wscWikiArticle[]).map((article) => {
          // Humanize last updated and last created date
          const lastUpdate = time(parseISO(article.updated_at), "R");
          // Create and send the embed
          const embed = new MessageEmbed()
            .setTitle(`${article.title}`)
            .setURL(`https://workshop.codes/wiki/articles/${article.slug}`)
            .setColor("#3fbf74")
            .setDescription(`${truncate(article.content, 1000)}`)
            .addField(
              "Category",
              article.category.title,
              true
            )
            .addField("Last updated", lastUpdate, true)
            .setFooter({
              text: "workshop.codes | Powered by Elo Hell Esports",
              iconURL: "https://ehe.gg/media/img/logos/Elo-Hell-Logo_I-C-Dark.png"
            });
          return embed;
        });
        await interaction.editReply({
          content: "The best wiki article I could find was...",
          embeds: embeds
        });
        break;
      }
      default:
        return false;
    }
    return true;
  }
}

function truncate(str : string, n : number) {
  return str.length > n ? `${str.slice(0, n)}...` : str;
}
