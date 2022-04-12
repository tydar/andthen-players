import * as players from './players.js';

export const mountRoutes = app => {
	app.use('/players', players.router);
};
