import Router from 'express-promise-router';
import * as db from '../db/index.js';
import * as jose from 'jose';

export const router = new Router();

router.get('/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const { rows } = await db.query('SELECT * FROM players WHERE id = $1', [id]);

		if (Array.isArray(rows) && rows.length > 0) {
			res.send({ status: 'success', data: rows[0] });
			return;
		}
		res.send({status: 'fail', data: {'message': `player record not found with id ${id}`}});
	} catch (err) {
		console.log(err.stack);
		res.send({
			status: 'error', 
			message: 'Database error', 
			code: 500
		});
	}
});

router.get('/user/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const { rows } = await db.query('SELECT * FROM players WHERE user_id = $1', [id]);

		if (Array.isArray(rows) && rows.length > 0) {
			res.send({ status: 'success', data: rows[0] });
			return;
		}
		res.send({status: 'fail', data:{'message': `player record not found with user id ${id}`}});
	} catch (err) {
		console.log(err.stack);
		res.send({
			status: 'error',
			message: 'Database error',
			code: 500
		});
	}
});

router.post('/', async (req, res) => {
	const { authHeader } = req.get('Authorization');
	if (typeof authHeader === 'undefined') {
		res.send({status: 'error', message: 'not authenticated', code: 401, data:{'WWW-Authenticate': 'Bearer'}});
		return;
	}

	if (!authHeader.startsWith('Bearer ')) {
		res.send({status: 'error', message: 'expected Bearer token', code: 400});
		return;
	}

	const jwt = authHeader.slice("Bearer ".length);
	const { payload } = await jose.jwtVerify(jwt, "your-256-bit-secret");
	const { admin } = payload;

	if (typeof admin !== 'boolean') {
		res.send({status: 'error', message: 'not authorized', code: 403});
		return;
	}

	if (!admin) {
		res.send({status: 'error', message: 'not authorized', code: 403});
		return;
	}

	const { display_name = "", user_id } = req.body;
	if (typeof user_id === 'undefined') {
		res.send({status: 'error', message: 'user_id required in request object', code: 400});
		return;
	}

	try {
		const res = await db.query(
			'INSERT INTO players (display_name, user_id) values ($1, $2)', 
			[display_name, user_id]
		);

		if (Array.isArray(rows) && rows.length > 0) {
			res.send({ status: 'success', data: rows[0] });
			return;
		} 
		res.send({status: 'fail', data:{message: 'new player failed to create'}});
	} catch(err) {
		console.log(err.stack);
		res.send({
			status: 'error',
			message: 'Database error',
			code: 500
		});
	}
});
