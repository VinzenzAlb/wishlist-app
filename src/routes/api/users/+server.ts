import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errMsg, getDb } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const sql = getDb();
		const rows = await sql`select id, name from users order by name`;
		return json(rows);
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};
