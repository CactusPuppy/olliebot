import { ChatInputCommandErrorPayload, Events, Listener } from "@sapphire/framework";
import winston from "winston";
import OllieBotError from "../lib/OllieBotError";

export class CommandErrorListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ChatInputCommandError
    });
  }

  public run(error: Error | OllieBotError, payload: ChatInputCommandErrorPayload) {
    const interaction = payload.interaction;
    winston.error(`${error.message}\n${error.stack || ""}`);
    if (interaction.replied) return;
    const errorMessage = `Something went wrong. Sorry about that!\n\nError code: ${error instanceof OllieBotError ? error.errorCode : "Otter"}`;
    if (interaction.deferred) {
      interaction.editReply(errorMessage);
    }
    else {
      interaction.reply(errorMessage);
    }
  }
}
