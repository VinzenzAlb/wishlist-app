export type User = {
	id: string;
	name: string;
	created_at?: string;
};

export type Wish = {
	id: string;
	user_id: string;
	title: string;
	link: string | null;
	priority: number | null;
	created_at: string;
	updated_at: string;
};

export type Purchased = {
	id: string;
	user_id: string;
	wish_id: string;
	created_at: string;
};

export type SortMode = 'priority' | 'created_at' | 'title';

export type WishInput = {
	title: string;
	link: string | null;
	priority: number;
};
