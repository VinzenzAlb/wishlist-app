-- Wishlist schema (Neon Postgres). Faithful mirror of the original Supabase
-- schema, confirmed via live introspection of the source database.
-- Applied to the DB pointed at by DATABASE_URL_UNPOOLED (direct connection).
--
-- One intentional deviation from the source: id defaults use the built-in
-- gen_random_uuid() instead of uuid_generate_v4() (the uuid-ossp variant).
-- They are equivalent v4 UUIDs; gen_random_uuid() avoids needing an extension.
-- Everything else (nullability, defaults, constraints) matches the source exactly.

create table if not exists users (
	id         uuid primary key default gen_random_uuid(),
	name       text not null unique,
	created_at timestamptz default now()
);

create table if not exists wishes (
	id         uuid primary key default gen_random_uuid(),
	user_id    uuid references users (id) on delete cascade,
	title      text not null,
	link       text,
	priority   integer default 0,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create table if not exists purchased (
	id         uuid primary key default gen_random_uuid(),
	user_id    uuid references users (id) on delete cascade,
	wish_id    uuid references wishes (id) on delete cascade,
	created_at timestamptz default now()
);
