import Router from 'express-promise-router';
import * as db from '../db/index.js';
import * as jose from 'jose';

export const router = new Router();

const stringToKey = (str) => {
	const encoder = new TextEncoder();
	return encoder.encode(str);
};

router.get('/user/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const { rows } = await db.query('SELECT * FROM players WHERE user_id = $1', [id]);

		if (Array.isArray(rows) && rows.length > 0) {
			res.json({ status: 'success', data: rows[0] });
			return;
		}
		res.json({status: 'fail', data:{'message': `player record not found with user id ${id}`}});
	} catch (err) {
		console.log(err.stack);
		res.json({
			status: 'error',
			message: 'Database error',
			code: 500
		});
	}
});

router.get('/token', async (req, res) => {
	// if the user is authenticated
	// give them the token for their player id
	// or give an error
	const authHeader = req.get('Authorization');
	if (typeof authHeader === 'undefined') {
		res.json({status: 'error', message: 'not authenticated', code: 401, data:{'WWW-Authenticate': 'Bearer'}});
	}

	if (!authHeader.startsWith('Bearer ')) {
		res.json({status: 'error', message: 'expected Bearer token', code: 400});
	}

	const jwt = authHeader.slice("Bearer ".length);
	const { payload } = await jose.jwtVerify(jwt, stringToKey("your-256-bit-secret"));
	const { id } = payload;

	if (typeof id !== 'number') {
		res.json({status: 'error', message: `bad token payload type: ${typeof id}`});
	}

	var dbRes;
	try {
		dbRes = await db.query(
			'SELECT id FROM players WHERE user_id = $1',
			[id]
		);

		if (!Array.isArray(dbRes.rows) || dbRes.rows.length === 0) {
			console.log(dbRes);
			res.json({status: 'fail', data: {message: 'missing user record', db_response: dbRes.rows}});
		}
	} catch(err) {
		res.json({status: 'error', message: 'internal error', code: 500});
	}

	const playerJwt = await new jose.SignJWT({ 'player_id': dbRes.rows[0].id })
		.setProtectedHeader({alg: 'HS256'})
		.setIssuedAt()
		.setExpirationTime('1h')
		.sign(stringToKey('your-256-bit-secret'));

	res.cookie('player_jwt', playerJwt, {httpOnly: true, expires: new Date(Date.now() + 3600000)});
	res.json({status: 'success', data: null});
});

router.get('/get/:id', async (req, res) => {
	const { id } = req.params;

	try {
		const { rows } = await db.query('SELECT * FROM players WHERE id = $1', [id]);

		if (Array.isArray(rows) && rows.length > 0) {
			res.json({ status: 'success', data: rows[0] });
			return;
		}
		res.json({status: 'fail', data: {'message': `player record not found with id ${id}`}});
	} catch (err) {
		console.log(err.stack);
		res.json({
			status: 'error', 
			message: 'Database error', 
			code: 500
		});
	}
});

router.post('/', async (req, res) => {
	const { authHeader } = req.get('Authorization');
	if (typeof authHeader === 'undefined') {
		res.json({status: 'error', message: 'not authenticated', code: 401, data:{'WWW-Authenticate': 'Bearer'}});
		return;
	}

	if (!authHeader.startsWith('Bearer ')) {
		res.json({status: 'error', message: 'expected Bearer token', code: 400});
		return;
	}

	const jwt = authHeader.slice("Bearer ".length);
	const { payload } = await jose.jwtVerify(jwt, stringToKey("your-256-bit-secret"));
	const { admin } = payload;

	if (typeof admin !== 'boolean') {
		res.json({status: 'error', message: 'not authorized', code: 403});
		return;
	}

	if (!admin) {
		res.json({status: 'error', message: 'not authorized', code: 403});
		return;
	}

	const { display_name = "", user_id } = req.body;
	if (typeof user_id === 'undefined') {
		res.json({status: 'error', message: 'user_id required in request object', code: 400});
		return;
	}

	try {
		const res = await db.query(
			'INSERT INTO players (display_name, user_id) values ($1, $2)', 
			[display_name, user_id]
		);

		if (Array.isArray(rows) && rows.length > 0) {
			res.json({ status: 'success', data: rows[0] });
			return;
		} 
		res.json({status: 'fail', data:{message: 'new player failed to create'}});
	} catch(err) {
		console.log(err.stack);
		res.json({
			status: 'error',
			message: 'Database error',
			code: 500
		});
	}
});
