/**
 * This listener allows certain forum channel posts to be flagged as not allowing comments
 */

import { Events, Listener } from "@sapphire/framework";
import { Message, ThreadChannel } from "discord.js";
import dotenv from "dotenv";
import winston from "winston";
dotenv.config();

const NO_COMMENT_POSTS = (process.env.DISCORD_NO_COMMENT_POSTS || "").split(",").map(str => str.trim());

export class NoCommentsListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.MessageCreate
    });
  }

  public async run(message: Message) {
    if (message.author == message.client.user) return;
    if (!NO_COMMENT_POSTS.includes(message.channelId)) return;

    if (!(message.channel instanceof ThreadChannel)) {
      const channel_identifier = ("name" in message.channel) ? message.channel.name : message.channelId;
      winston.warn(`It looks like channel ${channel_identifier} isn't a thread!`);
      return;
    }

    await message.delete().catch(reason => {
      winston.error(`Could not delete message ${message.id} in #${("name" in message.channel) ? message.channel.name : message.channelId}: ${reason}`);});
    const replyMessage = await message.channel.send({
      allowedMentions: {
        users: [message.author.id]
      },
      content: `This is a read-only post ${message.author}! Create a new post to start a conversation.`
    });
    setTimeout(() => replyMessage.delete(), 10000);
  }
}
