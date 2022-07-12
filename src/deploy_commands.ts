import dotenv from "dotenv";
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import Command from "./commands/_command";

const clientId = process.env.DISCORD_CLIENT_ID || "", guildId = process.env.DISCORD_GUILD_ID || "";

const client = new REST({ version: "10" }).setToken(token || "");

import Ping from "./commands/ping.js";
import Search from "./commands/search.js";

const commands : Array<Command> = [
  new Ping(),
  new Search()
];

const data = commands.map((command) => command.getJSONable().toJSON());

client.put(Routes.applicationGuildCommands(clientId, guildId), { body: data })
  .then(() => console.log("Successfully registered aplication commands."));


