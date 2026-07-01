import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: ReturnType<typeof postgres> | null = null;

/**
 * Lazily create the Neon Postgres client from DATABASE_URL (the pooled
 * connection). Reading the env var at call time (not import time) keeps the
 * build working without a live database. `prepare: false` is required because
 * the pooled endpoint runs PgBouncer in transaction mode.
 */
export function getDb() {
	if (!client) {
		const url = env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		client = postgres(url, { ssl: 'require', prepare: false });
	}
	return client;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Database error');
