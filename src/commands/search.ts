import { bold, time } from "@discordjs/builders";
import axios from "axios";
import { parseISO } from "date-fns";
import dotenv from "dotenv";
import winston from "winston";
import type { wscPost, wscWikiArticle } from "..";
dotenv.config();

import { ApplicationCommandRegistry, Command } from "@sapphire/framework";
import { MessageEmbed } from "discord.js";
import type { ClientRequest } from "http";
import OllieBotError from "../lib/OllieBotError";
import { toSlug } from "../lib/utils/string_helper";
import WorkshopCodesConstants from "../config/constants/workshop-codes-constants";

export default class Search extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "search",
      description: "Search Workshop.codes repository of codes, or the wiki of articles"
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputInteraction) {
    await interaction.deferReply();
    switch (interaction.options.getSubcommand(true)) {
      case "codes": {
        await this.codesSearchSubcommandRun(interaction);
        break;
      }
      case "wiki": {
        await this.wikiSearchSubcommandRun(interaction);
        break;
      }
      default:
        return false;
    }
    return true;
  }

  private async codesSearchSubcommandRun(interaction: Command.ChatInputInteraction) {
    // Execute the search
    let data = await wscSearchRequest("/search.json", {
      "search": interaction.options.getString("query"),
      "category": interaction.options.getString("category"),
      "players": `${interaction.options.getNumber("num_players")}-${interaction.options.getNumber("num_players")}`,
      "hero": interaction.options.getString("hero")
    });

    // Process the data
    if (!Array.isArray(data)) {
      const error = new OllieBotError(`Expected array from Workshop.codes, got ${typeof data} instead`, "Wombat");
      throw error;
    }
    if ((<wscPost[]>data).length === 0) {
      interaction.editReply("I didn't find anything on Workshop.codes.");
      return true;
    }
    // Only include first three results
    /* TODO: In the future, maybe use Paginated messages
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
        .addFields([{
          name: post.categories.length <= 1
            ? "Category"
            : "Categories",
          value: `${post.categories.join(" | ")}`,
          inline: true
        },{
          name: "Created",
          value: created,
          inline: true
        },{
          name: "Last updated",
          value: lastUpdate,
          inline: true
        }])
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
  }

  private async wikiSearchSubcommandRun(interaction: Command.ChatInputInteraction) {
    let data = await wscSearchRequest(`/wiki/search/${encodeURIComponent(interaction.options.getString("query", true)).replace(".", " ")}.json`);

    // Process the data
    if (!Array.isArray(data)) {
      const error = new OllieBotError(`Expected array from Workshop.codes, got ${typeof data} instead`, "Wombat");
      throw error;
    }
    if ((<wscWikiArticle[]>data).length === 0) {
      interaction.editReply("I didn't find anything like that on the Workshop.codes wiki.");
      return true;
    }
    // Only include first result
    /* TODO: In the future, maybe use a Paginated message
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
        .addFields({
          name: "Category",
          value: article.category.title,
          inline: true
        },{
          name: "Last updated",
          value: lastUpdate,
          inline: true
        })
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
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => {
      builder
        .setName("search")
        .setNameLocalization("ko", "검색")
        .setDescription("Search Workshop.codes repository of codes, or the wiki of articles")
        .addSubcommand((command) =>
          command
            .setName("codes")
            .setNameLocalization("ko", "코드")
            .setDescription("Search for Workshop.codes posts")
            .addStringOption((option) =>
              option
                .setName("query")
                .setNameLocalization("ko", "검색어")
                .setDescription("Terms to search for")
                .setRequired(false)
            )
            .addStringOption((option) =>
              option
                .setName("category")
                .setNameLocalization("ko", "카테고리")
                .setDescription("Category of post")
                .addChoices(
                  ...WorkshopCodesConstants.Post.Categories.map((category) => { return { name: category.en, value: toSlug(category.en), nameLocalizations: { ko: category.ko } };})
                )
                .setRequired(false)
            )
            .addStringOption((option) =>
              option
                .setName("hero")
                .setNameLocalization("ko", "영웅")
                .setDescription("Overwatch hero included in post")
                .addChoices(
                  ...WorkshopCodesConstants.Post.Heroes.map((hero) => { return { name: hero.en, value: toSlug(hero.en), nameLocalizations: { ko: hero.ko } }; })
                )
                .setRequired(false)
            )
            .addStringOption((option) =>
              option
                .setName("map")
                .setNameLocalization("ko", "전장")
                .setDescription("Overwatch map supported by post")
                .addChoices(
                  ...WorkshopCodesConstants.Post.Maps.map((map) => { return { name: map.en, value: toSlug(map.en), nameLocalizations: { ko: map.ko } }; })
                )
                .setRequired(false)
            )
            .addNumberOption((option) =>
              option
                .setName("num_players")
                .setNameLocalization("ko", "플레이어")
                .setDescription("Number of supported players")
                .setRequired(false)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("wiki")
            .setNameLocalization("ko", "위키")
            .setDescription("Search for articles on the Workshop.codes wiki")
            .addStringOption((option) =>
              option
                .setName("query")
                .setNameLocalization("ko", "검색어")
                .setDescription("Terms to search for")
                .setRequired(true)
            )
        );
    }, {
      idHints: ["999829897105133579"],
      guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : []
    });
  }
}

function truncate(str : string, n : number) {
  return str.length > n ? `${str.slice(0, n)}...` : str;
}

async function wscSearchRequest(path: string, params?: Record<string, string | boolean | null>): Promise<unknown> {
  const searchURL = new URL("https://workshop.codes");
  searchURL.pathname = `${path.startsWith("/") ? "" : "/"}${path}`;
  if (params != undefined) {
    for (const key in params) {
      const value = params[key];
      if (value != null) {
        searchURL.searchParams.set(key, encodeURIComponent(value.toString()));
      }
    }
  }

  const response = await axios.get(searchURL.toString())
    .catch((error) => {
      let message : string;
      let errorCode : string;
      if (error.response) {
        // Non-200 status
        message = `Workshop.codes responded with code ${error.response.status} - ${error.response.statusText}\nRequest: \`${(error.request as ClientRequest).path}\``;
        errorCode = "Beaver";
      }
      else if (error.request) {
        message = `Failed to contact Workshop.codes: ${error.request} did not get a response`;
        errorCode = "Tortoise";
      }
      else {
        message = `Axios initialization error: Malformed request? ${error.message}`;
        errorCode = "Foxhound";
      }
      winston.debug(error.config);
      throw new OllieBotError(message, errorCode);
    });

  return response.data;
}
