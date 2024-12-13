import { prisma } from "@/db/client";
import { truncate } from "@/lib/utils/string_helper";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";

export class FAQCommandAutocompleteHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    });
  }

  public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
    return interaction.respond(result);
  }

  public override async parse(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== "faq") return this.none();
    const focusedOption = interaction.options.getFocused(true);
    switch (focusedOption.name) {
      case "name":
        const matches = await prisma.faq.findMany({
          where: {
            name: {
              contains: focusedOption.value
            }
          }
        });
        return this.some(matches.map((faq) => ({ name: faq.name, value: faq.name })));
    }

    return this.none();
  }
}
