import { Events, Listener } from "@sapphire/framework";
import { Message, NewsChannel } from "discord.js";
import dotenv from "dotenv";
import winston from "winston";
dotenv.config();
const AUTO_PUBLISH_CHANNELS = (process.env.DISCORD_AUTO_PUBLISH_CHANNELS || "").split(",").map(str => str.trim());

export class AutoPublishListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.MessageCreate
    });
  }

  public async run(message: Message) {
    if (!AUTO_PUBLISH_CHANNELS.includes(message.channelId)) return;

    // Only publish from news channels
    if (!(message.channel instanceof NewsChannel)) {
      const channel_identifier = ("name" in message.channel) ? message.channel.name : message.channelId;
      winston.warn(`It looks like channel ${channel_identifier} isn't a news channel!`);
      return;
    }
    if (!message.crosspostable) {
      winston.error(`Cannot auto-publish message ${message.id} in #${message.channel.name}.\nAm I lacking the MANAGE_MESSAGES or SEND_MESSAGES permission in this channel?`);
      return;
    }

    const newMessage = await message.crosspost();
    if (!newMessage.flags.has("CROSSPOSTED")) {
      winston.warn(`Attempted to auto-publish message ${message.id} in #${message.channel.name}, but it looks like the message failed to publish.`);
    }
  }
}
