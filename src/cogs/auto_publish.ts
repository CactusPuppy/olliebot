import { NewsChannel } from "discord.js";
import dotenv from "dotenv";
import winston from "winston";
dotenv.config();
const AUTO_PUBLISH_CHANNELS = (process.env.DISCORD_AUTO_PUBLISH_CHANNELS || "").split(",").map(str => str.trim());

import { client } from "../main";

client.on("messageCreate", async message => {
  if (!(message.channelId in AUTO_PUBLISH_CHANNELS)) return;

  // Only publish from news channels
  if (!(message.channel instanceof NewsChannel)) {
    const channel_identifier = ("name" in message.channel) ? message.channel.name : message.channelId;
    winston.warn(`It looks like channel ${channel_identifier} isn't a news channel!`);
    return;
  }
  if (!message.crosspostable) {
    winston.error(`Cannot auto-publish message ${message.id} in #${message.channel.name}.\nAm I lacking the MANAGE_MESSAGES permission in this channel?`);
    return;
  }

  const newMessage = await message.crosspost();
  if (!newMessage.flags.has("CROSSPOSTED")) {
    winston.warn(`Attempted to auto-publish message ${message.id} in #${message.channel.name}, but it looks like the message failed to publish.`);
  }
});
