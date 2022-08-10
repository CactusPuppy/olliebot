import dotenv from "dotenv";
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
import { REST } from "@discordjs/rest";
import { Routes, RESTGetAPIApplicationGuildCommandResult } from "discord-api-types/v10";

const clientId = process.env.DISCORD_CLIENT_ID || "", guildId = process.env.DISCORD_GUILD_ID || "";

const client = new REST({ version: "10" }).setToken(token || "");

import Ping from "./commands/ping.js";
import Search from "./commands/search.js";

// const data = commands.map((command) => command.getJSONable().toJSON());

// client.put(Routes.applicationGuildCommands(clientId, guildId), { body: data })
//   .then(() => console.log("Successfully registered application commands."));

// client.get(Routes.applicationGuildCommands(clientId, guildId))
//   .then((response) => {
//     (response as RESTGetAPIApplicationGuildCommandResult[]).map(async (command) => {
//       await client.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
//       console.log(`Deleted command ID ${command.id} "/${command.name}"`);
//     });
//   });


