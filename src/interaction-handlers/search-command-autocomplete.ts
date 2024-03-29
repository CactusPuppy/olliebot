import { InteractionHandler, InteractionHandlerTypes, PieceContext } from "@sapphire/framework";
import type { AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import WorkshopCodesConstants from "../config/constants/workshop-codes-constants";
import { toSlug } from "../lib/utils/string_helper";


export class SearchCommandAutocompleteHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "codes": {
        interaction.respond(this.codesSearchAutocompleteRun(interaction).slice(0, 25));
        break;
      }
      default:
        interaction.respond([]);
    }
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== "search") return this.none();
    return this.some();
  }

  private codesSearchAutocompleteRun(interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData[] {
    const focusedOption = interaction.options.getFocused(true);
    const locale = ((<string[]><unknown>WorkshopCodesConstants.SupportedLocales).includes(interaction.locale)) ? <typeof WorkshopCodesConstants.SupportedLocales[number]>interaction.locale : "en";
    switch (focusedOption.name) {
      case "hero": {
        return WorkshopCodesConstants.Post.Heroes
          .filter((heroObject) => toSlug(heroObject[locale], locale).startsWith(toSlug(focusedOption.value, locale)))
          .map((heroObject) => { return { name: heroObject[locale], value: heroObject[locale], nameLocalizations: { en: heroObject.en, ko: heroObject.ko } }; });
      }
      case "map": {
        return WorkshopCodesConstants.Post.Maps
          .filter((mapObject) => mapObject[locale].toLocaleLowerCase(locale).startsWith(focusedOption.value.toLocaleLowerCase(locale)))
          .map((mapObject) => { return { name: mapObject[locale], value: mapObject[locale], nameLocalizations: { en: mapObject.en, ko: mapObject.ko } }; });
      }
    }
    return [] as ApplicationCommandOptionChoiceData[];
  }
}
