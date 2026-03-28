import { createLogger, format, transports } from "winston";
import util from "util";

const isProduction = process.env.NODE_ENV === "production";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    isProduction ? format.json() : format.simple(),
  ),
  transports: [
    new transports.Console({
      format: isProduction
        ? format.json()
        : format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...metadata }) => {
              const msg = `[${timestamp}] ${level}: ${message}`;
              const details = Object.keys(metadata).length
                ? `\n${util.inspect(metadata, { colors: true, depth: 3 })}`
                : "";
              return msg + details;
            }),
          ),
    }),
  ],
});
