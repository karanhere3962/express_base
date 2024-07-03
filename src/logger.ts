import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

interface LoggerConfig {
  stage?: string;
  loggingDir?: string;
  retentionPeriod?: string;
  logLevel?: string;
}

interface LogInfo {
  timestamp?: string;
  level?: string;
  message?: string;
}

function createLogger({
  stage = "development",
  loggingDir = "logs",
  retentionPeriod = "14d",
  logLevel = "info",
}: LoggerConfig): winston.Logger {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  winston.addColors({
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
  });

  const levelFunction = (): string => {
    const isDevelopment = stage === "development";
    return isDevelopment ? "debug" : logLevel;
  };

  const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info: LogInfo) =>
        `${info.timestamp || "Unknown Time"} ${
          info.level || "Unknown Level"
        }: ${info.message || "No message"}`
    )
  );

  const transports: winston.transport[] = [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: `${loggingDir}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: retentionPeriod,
      level: "error",
    }),
    new DailyRotateFile({
      filename: `${loggingDir}/all-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: retentionPeriod,
    }),
  ];

  const logger = winston.createLogger({
    level: levelFunction(),
    levels,
    format,
    transports,
  });

  return logger;
}

export default createLogger;
