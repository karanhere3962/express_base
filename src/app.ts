import express from 'express';
import {port} from './setup';
import {startServer} from './utils';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.send(`${process.env.HELLO_WORLD}`);
});

startServer(app, port);