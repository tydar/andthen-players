import * as db from './db/index.js';

export const listenForUserCreation = async () => {
	const client = await db.getClientListener();
	client.query('LISTEN user_player');
	client.on('notification', async (data) => {
		const { payload } = data;
		const { display_name='', user_id } = payload;

		if (typeof user_id !== 'number') {
			console.error('message to user_player channel with bad user_id');
			return;
		}
		try {
			const rows = await client.query(
				'INSERT INTO players (display_name, user_id) values $1, $2', 
				[display_name, user_id]
			);
			if (Array.isArray(rows) && rows.length > 0) {
				console.log(`new player created: ${rows[0]}`);
			} else {
				console.error('new player creation failed');
			}
		} catch(err) {
			console.error(`database error: ${err}`);
		}
	});
};
