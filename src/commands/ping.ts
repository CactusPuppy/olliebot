import { ChatInputCommand, Command } from "@sapphire/framework";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { Message } from "discord.js";

export default class Ping extends Command {
  public constructor(context : Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "ping",
      description: "Pong! Check if Olliebot is still alive"});
  }

  public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      { idHints: ["1006714349169147944"] });
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const msg = await interaction.reply({ content: "Ping?", ephemeral: true, fetchReply: true }) as Message;
    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }
    return interaction.editReply("Failed to retrieve ping :(");
  }
}
