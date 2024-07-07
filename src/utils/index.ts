import { Express } from "express";
import { logger } from "../setup";

export function startServer(app: Express, port: number) {
  app
    .listen(port, () => {
      logger.info(`Server started on http://localhost:${port}`);
    })
    .on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Check if the error is about the address already in use
        logger.info(`Port ${port} is already in use, trying port ${port + 1}`);
        startServer(app, port + 1); // Recursively attempt to start on next port
      } else {
        logger.error(err); // Log other types of errors and potentially stop execution
      }
    });
}
