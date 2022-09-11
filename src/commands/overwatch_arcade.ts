import { time, TimestampStyles } from "@discordjs/builders";
import { ChatInputCommand, Command } from "@sapphire/framework";
import axios from "axios";
import { addDays, parseISO } from "date-fns";
import { MessageEmbed } from "discord.js";
import winston from "winston";

import OllieBotError from "../lib/OllieBotError";

import type { ClientRequest } from "http";
import type { AxiosError } from "axios";
import type { owtAPIResponse, owtOverwatchTodayData } from "..";


export default class OverwatchArcade extends Command {
  public constructor(context : Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: "overwatch-arcade",
      description: "Get information about arcade gamemodes currently available"});
  }

  public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        // TODO(netux): populate with this command's ID
        // idHints: [],
        guildIds: process.env.DISCORD_GUILD_ID != null ? [process.env.DISCORD_GUILD_ID] : []
      });
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const response = await callOverwatchArcadeTodayAPI<owtOverwatchTodayData>("/overwatch/today");

    const createdAt = parseISO(response.createdAt);
    const nextUpdateAt = startOfTomorrow();

    const embed = new MessageEmbed()
      .setTitle("Overwatch Arcade")
      .setURL("https://overwatcharcade.today/overwatch")
      .setColor("#a2dc26")
      .setDescription(`As of ${response.isToday ? "today" : time(createdAt, TimestampStyles.ShortDate)} (${time(createdAt, TimestampStyles.RelativeTime)})`)
      .addFields(
        [
          {
            name: "Modes",
            value: response.modes
              .map((mode) => {
                let item = `- **${mode.name}** ${mode.players}`;
                if (mode.label) {
                  item += ` (${mode.label})`;
                }
                return item;
              })
              .join("\n")
          },
          {
            name: "Next update",
            value: time(nextUpdateAt, TimestampStyles.RelativeTime)
          }
        ]
      )
      .setFooter({
        text: "Powered by overwatcharcade.today",
        iconURL: "https://raw.githubusercontent.com/OverwatchArcade/Frontend/main/static/img/ow-arcade-115.png"
      });

    await interaction.reply({
      embeds: [embed]
    });
  }
}

function startOfTomorrow() {
  let date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date = addDays(date, 1);
  return date;
}

async function callOverwatchArcadeTodayAPI<D>(path: string, params?: Record<string, string | boolean | null>): Promise<D> {
  const apiURL = new URL("https://api.overwatcharcade.today/api/v1");
  apiURL.pathname += `${path.startsWith("/") ? "" : "/"}${path}`;
  if (params != undefined) {
    for (const key in params) {
      const value = params[key];
      if (value != null) {
        apiURL.searchParams.set(key, encodeURIComponent(value.toString()));
      }
    }
  }

  const response = await axios.get<owtAPIResponse>(apiURL.toString())
    .catch((error: AxiosError) => {
      let message : string;
      let errorCode : string;
      if (error.response) {
        // Non-200 status
        message = `overwatcharcade.today responded with code ${response.status} - ${response.data.errorMessages?.join(", ") ?? JSON.stringify(response.data)}\nRequest: \`${(error.request as ClientRequest).path}\``;
        errorCode = "Beaver";
      }
      else if (error.request) {
        message = `Failed to contact overwatcharcade.today: ${error.request} did not get a response`;
        errorCode = "Tortoise";
      }
      else {
        message = `Axios initialization error: Malformed request? ${error.message}`;
        errorCode = "Foxhound";
      }
      winston.debug(error.config);
      throw new OllieBotError(message, errorCode);
    });

  return response.data.data as D;
}
