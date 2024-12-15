import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { ApplicationCommandRegistry, Awaitable, ChatInputCommand, Command } from "@sapphire/framework";
import { ActionRowBuilder, ChatInputCommandInteraction, escapeInlineCode, inlineCode, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export default class AddFAQ extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "faq-add",
      description: "Creates an easily accessible a response to a frequently asked question via a short name",
      detailedDescription: "The FAQ command associates long, oft-repeated explanations, descriptions, or other information with a shorter name. The shortname can be used to prompt the bot to repost the longer message."
    })
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
      registry.registerChatInputCommand((builder) => {
        builder
          .setName(this.name)
          .setDescription(this.description)
      }, {
        guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : undefined,
        idHints: process.env.ADD_FAQ_COMMAND_ID != null ? [process.env.ADD_FAQ_COMMAND_ID] : undefined
      });
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction, _: ChatInputCommand.RunContext): Promise<boolean> {
    const faqModal = new ModalBuilder()
      .setCustomId("add_faq_modal")
      .setTitle("New FAQ");

    const nameField = new TextInputBuilder()
      .setCustomId("name_input")
      .setLabel("Name")
      .setRequired(true)
      .setPlaceholder("Enter a shortname for the FAQ")
      .setStyle(TextInputStyle.Short);

    const contentField = new TextInputBuilder()
      .setCustomId("content_input")
      .setLabel("Content")
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    faqModal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameField),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(contentField)
    );
    await interaction.showModal(faqModal)

    return true;
  }
}
