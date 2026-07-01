import type { Purchased, User, Wish, WishInput } from '$lib/types';

type ServiceResult<T> = { data: T; error: { message: string } | null };

const JSON_HEADERS = { 'content-type': 'application/json' };

async function request<T>(path: string, init?: RequestInit): Promise<ServiceResult<T>> {
	try {
		const res = await fetch(path, init);
		const text = await res.text();
		const body = text ? JSON.parse(text) : null;
		if (!res.ok) {
			return { data: null as T, error: { message: body?.message ?? res.statusText } };
		}
		return { data: body as T, error: null };
	} catch (e) {
		return {
			data: null as T,
			error: { message: e instanceof Error ? e.message : 'Netzwerkfehler' }
		};
	}
}

export async function fetchUsers() {
	return request<User[]>('/api/users');
}

export async function fetchWishes(userId: string) {
	return request<Wish[]>(`/api/wishes?userId=${encodeURIComponent(userId)}`);
}

export async function fetchPurchasesFor(ids: string[]): Promise<ServiceResult<Purchased[]>> {
	if (!ids.length) return { data: [], error: null };
	return request<Purchased[]>(`/api/purchased?wishIds=${ids.map(encodeURIComponent).join(',')}`);
}

export async function insertWish(userId: string, payload: WishInput) {
	return request<Wish>('/api/wishes', {
		method: 'POST',
		headers: JSON_HEADERS,
		body: JSON.stringify({ user_id: userId, ...payload })
	});
}

export async function updateWish(wishId: string, payload: WishInput) {
	return request<Wish>(`/api/wishes/${wishId}`, {
		method: 'PATCH',
		headers: JSON_HEADERS,
		body: JSON.stringify(payload)
	});
}

export async function removeWish(wishId: string) {
	return request<null>(`/api/wishes/${wishId}`, { method: 'DELETE' });
}

export async function insertPurchase(wishId: string, userId: string) {
	return request<Purchased>('/api/purchased', {
		method: 'POST',
		headers: JSON_HEADERS,
		body: JSON.stringify({ wish_id: wishId, user_id: userId })
	});
}

export async function removePurchase(purchaseId: string) {
	return request<null>(`/api/purchased/${purchaseId}`, { method: 'DELETE' });
}
