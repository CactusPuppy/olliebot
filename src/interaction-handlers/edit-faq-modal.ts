import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import type { ModalSubmitInteraction } from "discord.js";

export class EditFAQModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public async parse(interaction: ModalSubmitInteraction) {
    const match = interaction.customId.match(/edit_faq_(\d+)_modal/);
    if (match == null) return this.none();
    // if (!interaction.isFromMessage()) return this.none();

    return this.some();
  }

  public async run(interaction: ModalSubmitInteraction) {
    const match = interaction.customId.match(/edit_faq_(\d+)_modal/);
    if (match == null) return;
    const id = parseInt(match[1]);
    const results = await prisma.faq.findMany({
      where: {
        id: {
          equals: id,
        }
      }
    }).catch((err) => {
      throw new OllieBotError("Failed to check if FAQ exists: " + err, "Elk");
    });

    if (results.length == 0) {
      throw new OllieBotError(`No FAQs with the id ${id} found`, "Elk");
    } else if (results.length > 1) {
      throw new OllieBotError(`Multiple FAQs with the same id ${id} found`, "Elk");
    }

    await prisma.faq.update({
      where: {
        id: id,
      },
      data: {
        name: interaction.fields.getTextInputValue("name_input").toLowerCase(),
        content: interaction.fields.getTextInputValue("content_input"),
      }
    }).catch((err) => {
      throw new OllieBotError("Failed to edit FAQ: " + err, "Elk");
    });

    await interaction.reply({
      content: "FAQ edited!",
      ephemeral: true,
    });
  }
}
