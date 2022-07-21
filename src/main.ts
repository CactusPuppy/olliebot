import dotenv from "dotenv";
import { Logger } from "winston";
import winston, { format, transports } from "winston";
import DiscordTransport from "winston-discord-transport";
import { Client, Collection, Intents } from "discord.js";
dotenv.config();
import fs from "fs";

const token = process.env.DISCORD_BOT_TOKEN;
export const serviceName = process.env.SERVICE_NAME || "OllieBot";

// Set up logging
initializeDefaultLogger();


export const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES] });

client.once("ready", () => {
  winston.info("OllieBot is ready!");
});

// Register handler for slash commands
import Command from "./commands/_command";
export const commands : Collection<string, Command> = new Collection();
const commandFiles = fs.readdirSync("./dist/commands").filter(file => !file.startsWith("_")).filter(file => file.endsWith(".js"));
commandFiles.forEach(file =>
  import(`./commands/${file}`)
    .then(file => {
      const command = new file.default() as Command;
      commands.set(command.name, command);
    })
);

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);

  if (command == undefined) {
    interaction.reply("OllieBot forgot how to run that command. Sorry :/");
    return;
  }

  let success = false;
  try {
    success = await command.run(interaction);
  } catch (error) {
    winston.error(error);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    if (success || interaction.replied) return;
    const reply = "OllieBot ran into a problem while running this command";
    if (interaction.deferred) {
      await interaction.editReply({
        content: reply,
      });
    } else {
      await interaction.reply({
        content: reply,
        ephemeral: true
      });
    }
  }
});

// initialize bot
client.login(token);

function initializeDefaultLogger(): void {
  const finalFormatter = format((topInfo, topOpts) => {
    return format.combine(
      format((info) => {
        info.level = info.level.toLocaleUpperCase();
        return info;
      })(),
      topOpts.colorize ? format.colorize() : format.uncolorize(),
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.printf((info) => `[${info.timestamp}] (${info.service} | ${info.level}): ${info.message}`),
    ).transform(topInfo);
  });

  winston.configure({
    level: "info",
    format: finalFormatter(),
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: finalFormatter({ colorize: true }),
      }),
    ],
  });

  // Log to files when not in production
  if (process.env.NODE_ENV !== "production") {
    winston.add(new transports.File({ filename: "log/error.log", level: "error" }));
    winston.add(new transports.File({ filename: "log/cerberus.log" }));
    winston.exceptions.handle(new transports.File({ filename: "log/exceptions.log" }));
  }

  // If a webhook is defined, use it
  if (process.env.DISCORD_LOGS_WEBHOOK_URL) {
    winston.add(new DiscordTransport({
      webhook: process.env.DISCORD_LOGS_WEBHOOK_URL,
      defaultMeta: { service: serviceName },
      level: process.env.DISCORD_LOGS_LEVEL ?? "info",
      handleExceptions: true,
    }));
  }

  // Don't stop logging after uncaught error
  winston.exitOnError = false;
}
