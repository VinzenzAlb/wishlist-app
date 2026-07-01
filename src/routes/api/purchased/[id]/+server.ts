import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errMsg, getDb } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const sql = getDb();
		await sql`delete from purchased where id = ${params.id}`;
		return new Response(null, { status: 204 });
	} catch (e) {
		return json({ message: errMsg(e) }, { status: 500 });
	}
};
