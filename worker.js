import * as db from './db/index.js';

export const listenForUserCreation = async () => {
	const client = await db.getClientListener();
	client.query('LISTEN user_player');
	client.on('notification', async (data) => {
		const { payload } = data;
		const JSONpayload = JSON.parse(payload);
		const { display_name='', user_id } = JSONpayload;
		
		console.log(`user_id: ${user_id}; typeof user_id ${typeof user_id}`);

		if (typeof user_id !== 'number') {
			console.error('message to user_player channel with bad user_id');
			console.error(user_id)
			return;
		}
		try {
			const res = await client.query(
				'INSERT INTO players (display_name, user_id) VALUES($1, $2) RETURNING *',
				[display_name, user_id]
			);
			if (Array.isArray(res.rows) && res.rows.length > 0) {
				console.log(`new player created: ${res.rows[0]}`);
			} else {
				console.log(res.rows);
				console.error('new player creation failed');
			}
		} catch(err) {
			console.error(`database error: ${err}`);
		}
	});
};
