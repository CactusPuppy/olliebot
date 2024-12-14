import { ChatInputCommandErrorPayload, Events, InteractionHandlerError, Listener } from "@sapphire/framework";
import winston from "winston";
import OllieBotError from "../lib/OllieBotError";
import { Interaction } from "discord.js";

export class CommandErrorListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.InteractionHandlerError
    });
  }

  public run(error: Error | OllieBotError, payload: InteractionHandlerError) {
    const interaction = payload.interaction;
    if (!interaction.isModalSubmit()) return;
    if (interaction.replied) return;
    winston.error(`${error.message}\n${error.stack || ""}`);
    const errorMessage = `Something went wrong. Sorry about that!\n\nError code: ${error instanceof OllieBotError ? error.errorCode : "Otter"}`;
    if (interaction.deferred) {
      interaction.editReply(errorMessage);
    }
    else {
      interaction.reply({
        content: errorMessage,
        ephemeral: true
    });
    }
  }
}
