'use strict';

import express from 'express';
import * as routes from './routes/index.js';
import * as worker from './worker.js';

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.use(express.json());

routes.mountRoutes(app);

app.listen(PORT, HOST);
worker.listenForUserCreation();

console.log(`Running on http://${HOST}:${PORT}`);
