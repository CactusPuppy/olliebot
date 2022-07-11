import { CommandInteraction } from "discord.js";
import Command from "./_command";

export default class Ping extends Command {
  constructor () {
    super("ping", "Pong!");
  }

  async run(interaction : CommandInteraction) {
    await interaction.reply({
      content: "Pong!",
      ephemeral: true,
      fetchReply: false
    });
    return true;
  }
}
