import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errMsg, getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId');
	if (!userId) return json({ message: 'userId is required' }, { status: 400 });
	try {
		const sql = getDb();
		const rows = await sql`select * from wishes where user_id = ${userId}`;
		return json(rows);
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		if (!body?.user_id || !body?.title) {
			return json({ message: 'user_id and title are required' }, { status: 400 });
		}
		const sql = getDb();
		const [row] = await sql`
			insert into wishes ${sql(
				{
					user_id: body.user_id,
					title: body.title,
					link: body.link ?? null,
					priority: body.priority ?? 0
				},
				'user_id',
				'title',
				'link',
				'priority'
			)}
			returning *`;
		return json(row, { status: 201 });
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};
