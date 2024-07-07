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

  // Base log format
  const logFormat = winston.format.printf(
    (info: LogInfo) =>
      `${info.timestamp || "Unknown Time"} ${info.level || "Unknown Level"}: ${
        info.message || "No message"
      }`
  );

  // Format for console that includes colorization
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    logFormat
  );

  // Format for files that excludes colorization
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    logFormat
  );

  const levelFunction = (): string => {
    const isDevelopment = stage === "development";
    return isDevelopment ? "debug" : logLevel;
  };

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new DailyRotateFile({
      filename: `${loggingDir}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: retentionPeriod,
      level: "error",
      format: fileFormat,
    }),
    new DailyRotateFile({
      filename: `${loggingDir}/all-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: retentionPeriod,
      format: fileFormat,
    }),
  ];

  const logger = winston.createLogger({
    level: levelFunction(),
    levels,
    format: winston.format.combine(), // Default format not used directly
    transports,
  });

  return logger;
}

export default createLogger;
