import Router from 'express-promise-router';
import * as db from '../db/index.js';
import * as jose from 'jose';
import cookieParser from 'cookie-parser';

export const router = new Router();

router.use(cookieParser());

const stringToKey = (str) => {
	const encoder = new TextEncoder();
	return encoder.encode(str);
};

router.use(async (req, res, next) => {
	// authentication middleware used for all /games reqs
	const { andthen_auth } = req.cookies;

	if (typeof andthen_auth === 'undefined') {
		res.json({status: 'error', message: 'not authenticated', code:401})
	}

	try {
		const { payload } = await jose.jwtVerify(andthen_auth, stringToKey("your-256-bit-secret"));
		req.body.user_id = payload.id;
		req.body.admin = payload.admin;
		next();
	} catch(err) {
		res.json({status: 'error', message :`jwt auth token error ${err}`, code: 401});
	}
});

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
	if (typeof req.body.user_id !== 'number') {
		res.json({status: 'error', message: `bad token payload type: ${typeof id}`});
	}

	var dbRes;
	try {
		dbRes = await db.query(
			'SELECT id FROM players WHERE user_id = $1',
			[req.body.user_id]
		);

		if (!Array.isArray(dbRes.rows) || dbRes.rows.length === 0) {
			console.log(dbRes);
			res.json({status: 'fail', data: {message: 'missing user record', db_response: dbRes.rows}});
		}
	} catch(err) {
		console.log(err);
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
	if (typeof req.body.admin !== 'boolean') {
		res.json({status: 'error', message: 'not authorized', code: 403});
		return;
	}

	if (!req.body.admin) {
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
