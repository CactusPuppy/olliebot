import { Events, Listener } from "@sapphire/framework";
import { Client } from "discord.js";
import winston from "winston";

export class Ready extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ClientReady,
      once: true
    });
  }

  public run(client: Client) {
    winston.info(`OllieBot is logged in! Operating as ${client.user?.username}`);
  }
}
