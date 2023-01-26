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
    switch (focusedOption.name) {
      case "hero": {
        return WorkshopCodesConstants.Post.Heroes
          .filter((heroObject) => ((interaction.locale in WorkshopCodesConstants.SupportedLocales) ? heroObject[<typeof WorkshopCodesConstants.SupportedLocales[number]>interaction.locale] : heroObject.en).startsWith(focusedOption.value))
          .map((heroObject) => { return { name: heroObject.en, value: toSlug(heroObject.en), nameLocalizations: { ko: heroObject.ko } }; });
      }
      case "map": {
        return WorkshopCodesConstants.Post.Maps
          .filter((mapObject) => ((interaction.locale in WorkshopCodesConstants.SupportedLocales) ? mapObject[<typeof WorkshopCodesConstants.SupportedLocales[number]>interaction.locale] : mapObject.en).startsWith(focusedOption.value))
          .map((mapObject) => { return { name: mapObject.en, value: toSlug(mapObject.en), nameLocalizations: { ko: mapObject.ko } }; });
      }
    }
    return [] as ApplicationCommandOptionChoiceData[];
  }
}
