import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errMsg, getDb } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const sql = getDb();
		const [row] = await sql`
			update wishes
			set title = ${body.title}, link = ${body.link ?? null}, priority = ${body.priority ?? 0}
			where id = ${params.id}
			returning *`;
		if (!row) return json({ message: 'Wish not found' }, { status: 404 });
		return json(row);
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const sql = getDb();
		await sql`delete from wishes where id = ${params.id}`;
		return new Response(null, { status: 204 });
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};
