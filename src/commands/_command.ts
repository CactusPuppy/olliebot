import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";


export default abstract class Command {
  /**
   * Constructor for OllieBot commands
   * @param name The name of this command
   * @param description A description of what this command does
   */
  constructor(
    public name: string,
    public description: string,
  ) {
    this.name = name;
    this.description = description;
  }

  /**
   * The base command builder which commands can extend
   * @returns {SlashCommandBuilder}
   */
  protected getBaseCommandBuilder() : SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  /**
   * @returns Entity on which `toJSON` can be called to
   *          retrieve a RESTPostAPIApplicationCommandsJSONBody
   */
  getData() : Pick<SlashCommandBuilder, "toJSON"> {
    return this.getBaseCommandBuilder();
  }

  /**
   * Executes the effects of the command
   * @param interaction The interaction which triggered this command
   */
  abstract run(interaction: CommandInteraction): Promise<boolean>;
}
