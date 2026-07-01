import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errMsg, getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const ids = (url.searchParams.get('wishIds') ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	if (!ids.length) return json([]);
	try {
		const sql = getDb();
		const rows = await sql`select * from purchased where wish_id in ${sql(ids)}`;
		return json(rows);
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		if (!body?.wish_id || !body?.user_id) {
			return json({ message: 'wish_id and user_id are required' }, { status: 400 });
		}
		const sql = getDb();
		const [row] = await sql`
			insert into purchased ${sql({ wish_id: body.wish_id, user_id: body.user_id }, 'wish_id', 'user_id')}
			returning *`;
		return json(row, { status: 201 });
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};
