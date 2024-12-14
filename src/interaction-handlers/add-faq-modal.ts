import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ModalSubmitInteraction } from "discord.js";

export class AddFAQModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public async parse(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== "add_faq_modal") return this.none();
    // if (!interaction.isFromMessage()) return this.none();

    return this.some();
  }

  public async run(interaction: ModalSubmitInteraction) {
    const results = await prisma.faq.findMany({
      where: {
        name: {
          equals: interaction.fields.getTextInputValue("name_input").toLowerCase(),
        }
      }
    }).catch((err) => {
      throw new OllieBotError("Failed to check if FAQ already exists: " + err, "Elk");
    });

    if (results.length > 0) {
      await interaction.reply({
        content: `An FAQ with the name ${interaction.fields.getTextInputValue("name_input").toLowerCase()} already exists!`,
        ephemeral: true,
      });
      return;
    }

    await prisma.faq.create({
      data: {
        name: interaction.fields.getTextInputValue("name_input").toLowerCase(),
        content: interaction.fields.getTextInputValue("content_input"),
      }
    }).catch((err) => {
      throw new OllieBotError("Failed to add FAQ: " + err, "Elk");
    });

    await interaction.reply({
      content: "FAQ added!",
      ephemeral: true,
    });
  }
}
