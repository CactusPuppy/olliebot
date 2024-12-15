import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { ApplicationCommandRegistry, Awaitable, ChatInputCommand, Command } from "@sapphire/framework";
import { ActionRowBuilder, ChatInputCommandInteraction, escapeInlineCode, inlineCode, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export default class AddFAQ extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "faq-edit",
      description: "Edits an easily accessible a response to a frequently asked question via a short name",
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
        guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : undefined,
        idHints: process.env.EDIT_FAQ_COMMAND_ID != undefined ? [process.env.EDIT_FAQ_COMMAND_ID] : undefined
      });
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction, _: ChatInputCommand.RunContext): Promise<boolean> {
    // await interaction.deferReply({ ephemeral: true });
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

    const faqModal = new ModalBuilder()
      .setCustomId(`edit_faq_${results[0].id}_modal`)
      .setTitle("Edit FAQ");

    const nameField = new TextInputBuilder()
      .setCustomId("name_input")
      .setLabel("New Name")
      .setRequired(true)
      .setValue(results[0].name)
      .setStyle(TextInputStyle.Short);

    const contentField = new TextInputBuilder()
      .setCustomId("content_input")
      .setLabel("New Content")
      .setRequired(true)
      .setValue(results[0].content)
      .setStyle(TextInputStyle.Paragraph);

    faqModal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameField),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(contentField)
    );
    await interaction.showModal(faqModal);

    return true;
  }
}
