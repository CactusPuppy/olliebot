import { prisma } from "@/db/client";
import OllieBotError from "@/lib/OllieBotError";
import { ApplicationCommandRegistry, Awaitable, ChatInputCommand, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, escapeInlineCode, inlineCode, userMention } from "discord.js";

export default class FAQ extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "faq",
      description: "Access a response to a frequently asked question via a short name",
      detailedDescription: "The FAQ command associates long, oft-repeated explanations, descriptions, or other information with a shorter name. The shortname can be used to prompt the bot to repost the longer message."
    })
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
      registry.registerChatInputCommand((builder) => {
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) =>
            option
              .setName("name")
              .setDescription("The name of the FAQ")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("(Optional) The user to ping in the FAQ response")
              .setRequired(false)
          );
      }, {
        guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : undefined
      });
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction, _: ChatInputCommand.RunContext): Promise<boolean> {
    await interaction.deferReply();
    const nameQuery = interaction.options.getString("name", true);
    const user = interaction.options.getUser("user");

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
    }
    await interaction.editReply({
      content: `${user ? `${userMention(user.id)} ` : ""}${results[0].content}`,
      allowedMentions: {
        users: user ? [user.id] : []
      }
    });
    if (results.length > 1) {
      setTimeout(() => interaction.followUp({
        ephemeral: true,
        content: `Just a heads up, I found multiple FAQs whose names contain ${inlineCode(escapeInlineCode(nameQuery))} in my database. I posted the first FAQ I found which had a name containing ${inlineCode(escapeInlineCode(nameQuery))}, but in the future, being more specific will ensure you get the right FAQ!`
      }), 1000);
    }
    return true;
  }
}
