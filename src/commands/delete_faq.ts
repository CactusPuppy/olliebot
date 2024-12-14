import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { ApplicationCommandRegistry, Awaitable, ChatInputCommand, Command } from "@sapphire/framework";
import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, escapeInlineCode, inlineCode, Interaction, MessageActionRowComponentBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export default class AddFAQ extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "delete_faq",
      description: "Deletes an FAQ by name",
      detailedDescription: "The FAQ command associates long, oft-repeated explanations, descriptions, or other information with a shorter name. The shortname can be used to prompt the bot to repost the longer message."
    })
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
      registry.registerChatInputCommand((builder) => {
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) => option
            .setName("name")
            .setDescription("The name of the FAQ to edit")
            .setRequired(true)
            .setAutocomplete(true)
          );
      }, {
        guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : undefined
      });
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction, _: ChatInputCommand.RunContext): Promise<boolean> {
    await interaction.deferReply({ ephemeral: true });
    const nameQuery = interaction.options.getString("name", true);

    const results = await prisma.faq.findMany({
      where: {
        name: {
          contains: nameQuery
        }
      }
    }).catch((e) => {
      throw new OllieBotError(`Error when fetching FAQ from database: ${e}`, "Dingo");
    });

    if (results.length == 0) {
      interaction.editReply(inlineCode(`No FAQ found for ${nameQuery}`));
      return true;
    } else if (results.length > 1) {
      setTimeout(() => interaction.followUp({
        ephemeral: true,
        content: `Just a heads up, I found multiple FAQs whose names contain ${inlineCode(escapeInlineCode(nameQuery))} in my database. I chose the first FAQ I found which had a name containing ${inlineCode(escapeInlineCode(nameQuery))}, but in the future, being more specific will ensure you get the right FAQ!`
      }), 1000);
    }

    const response = await interaction.editReply({
      content: `Are you sure you want to delete the FAQ with the name ${inlineCode(results[0].name)}?`,
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`cancel`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`confirm`)
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger),
        )
      ]
    });

    const collectorFilter = (i: Interaction) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 15000 });

      if (confirmation.customId == "confirm") {
        await prisma.faq.delete({
          where: {
            id: results[0].id
          }
        }).catch((err) => {
          throw new OllieBotError(`Failed to delete FAQ with name ${results[0].name}: ${err}`, "Elk");
        });
        await confirmation.update({ content: `FAQ with name ${results[0].name} deleted!`, components: [] });
      } else if (confirmation.customId == "cancel") {
        await confirmation.update({ content: "Deletion cancelled", components: [] });
      }
    } catch (e) {
      await interaction.editReply({ content: "Deletion confirmation timed out after 15 seconds", components: [] });
    }

    return true;
  }
}
