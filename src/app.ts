import express from "express";
import { port } from "./setup";
import { startServer } from "./utils";
import { zodErrorHandler } from "./utils/errorHandler";
import KnexConfig from "../knexfile";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(zodErrorHandler);

app.get("/", (req, res) => {
  res.send(KnexConfig);
});

startServer(app, port);
