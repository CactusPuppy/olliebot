import { InteractionHandler, InteractionHandlerTypes, LoaderPieceContext, PieceContext } from "@sapphire/framework";
import type { AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import WorkshopCodesConstants from "../config/constants/workshop-codes-constants";
import { toSlug } from "../lib/utils/string_helper";
import { wscSearchCodesFromInteraction, wscSearchRequest, wscSearchWikiFromInteractionOptions } from "../commands/search";
import type { wscPost, wscWikiArticle } from "../types";
import OllieBotError from "../lib/OllieBotError";


export class SearchCommandAutocompleteHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result)
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== "search") return this.none();
    let results: ApplicationCommandOptionChoiceData[] | null = null;
    switch (interaction.options.getSubcommand()) {
      case "codes":
        results = await this.codesSearchAutocompleteRun(interaction);
        if (!results) return this.none();
        return this.some(results);

      case "wiki":
        results = await this.wikiSearchAutocompleteRun(interaction);
        if (!results) return this.none();
        return this.some(results);

      default:
        return this.none();
    }
  }

  private async codesSearchAutocompleteRun(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | null> {
    const focusedOption = interaction.options.getFocused(true);
    const locale = ((<string[]><unknown>WorkshopCodesConstants.SupportedLocales).includes(interaction.locale)) ? <typeof WorkshopCodesConstants.SupportedLocales[number]>interaction.locale : "en-US";
    switch (focusedOption.name) {
      case "hero": {
        return WorkshopCodesConstants.Post.Heroes
          .filter((heroObject) => toSlug(heroObject[locale] ?? heroObject["en-US"], locale).startsWith(toSlug(focusedOption.value, locale)))
          .map((heroObject) => { return { name: heroObject[locale] ?? heroObject["en-US"], value: heroObject[locale] ?? heroObject["en-US"], nameLocalizations: { "en-US": heroObject["en-US"], ko: heroObject.ko } }; });
      }
      case "map": {
        return WorkshopCodesConstants.Post.Maps
          .filter((mapObject) => mapObject[locale]?.toLocaleLowerCase(locale).startsWith(focusedOption.value.toLocaleLowerCase(locale)))
          .map((mapObject) => { return { name: mapObject[locale] ?? mapObject["en-US"], value: mapObject[locale] ?? mapObject["en-US"], nameLocalizations: { "en-US": mapObject["en-US"], ko: mapObject.ko } }; });
      }

      case "query": {
        const { data, error } = await wscSearchCodesFromInteraction(interaction);
        if (error) {
          throw new OllieBotError(`Failure to autocomplete in x subcommand: ${error}`, "Elk");
        }

        return (<wscPost[]> data).slice(0, 10).map((post) => ({
          name: `${post.title}${post.user.username == "elo-hell-archive" ? "" : " by " + post.user.username}`,
          value: post.code
        }));
      }

      default:
        return [];
    }
  }

  private async wikiSearchAutocompleteRun(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | null> {
    const focusedOption = interaction.options.getFocused(true);

    switch (focusedOption.name) {
      case "query": {
        const { data, error } = await wscSearchWikiFromInteractionOptions(interaction);
        if (error) {
          throw new OllieBotError(`Failure to autocomplete in x subcommand: ${error}`, "elk");
        }

        if (!Array.isArray(data)) {
          const error = new OllieBotError(`Expected array from Workshop.codes, got ${typeof data} instead`, "Wombat");
          throw error;
        }

        return (<wscWikiArticle[]> data).slice(0, 10).map((article) => ({
          name: article.title,
          value: article.slug
        }));
      }

      default:
        return [];
    }
  }
}
