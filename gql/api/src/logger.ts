
import pino from "pino";
import rfs from "rotating-file-stream";

interface LoggerConfig {
  stage?: string;
  loggingDir?: string;
  retentionPeriod?: number;
  logLevel?: string;
}

function createLogger({
  stage = "development",
  loggingDir = "logs",
  retentionPeriod = 14,
  logLevel = "info",
}: LoggerConfig) {
  const isDevelopment = stage === "development";
  const actualLogLevel = isDevelopment ? "debug" : logLevel;

  // Create a rotating write stream for all logs
  const streamAll = rfs.createStream("all-%DATE%.log", {
    interval: "1d", // rotate daily
    path: loggingDir,
    maxSize: "20M", // Rotate files larger than 20MB
    maxFiles: retentionPeriod, // Retention period as number of files
  });

  // Create a rotating write stream for error logs
  const streamError = rfs.createStream("error-%DATE%.log", {
    interval: "1d", // rotate daily
    path: loggingDir,
    maxSize: "20M", // Rotate files larger than 20MB
    maxFiles: retentionPeriod, // Retention period as number of files
  });

  const logger = pino(
    {
      level: actualLogLevel,
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    },
    pino.multistream([
      { stream: streamAll },
      { stream: streamError, level: "error" },
    ])
  );

  return logger;
}

export default createLogger;
