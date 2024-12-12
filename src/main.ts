import dotenv from "dotenv";
import winston, { format, transports } from "winston";
import DiscordTransport from "winston-discord-transport";
import { LogLevel, SapphireClient } from "@sapphire/framework";
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
export const serviceName = process.env.SERVICE_NAME || "OllieBot";

// Set up Winston logging
initializeDefaultLogger();

const client = new SapphireClient({
  intents: ["Guilds", "GuildMessages"],
  logger: {
    level: process.env.DEBUG == "true" ? LogLevel.Debug : LogLevel.Info
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
      topOpts instanceof Object && "colorize" in topOpts ? format.colorize() : format.uncolorize(),
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.printf((info) => `[${info.timestamp}] (${info.service} | ${info.level}): ${info.message}`),
    ).transform(topInfo);
  });

  winston.configure({
    level: process.env.CONSOLE_LOG_LEVEL || "info",
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
    winston.add(new transports.File({ filename: "log/main.log" }));
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
