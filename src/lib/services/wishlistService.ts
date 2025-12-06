import { supabase } from '$lib/supabaseClient';
import type { Purchased, SortMode, User, Wish, WishInput } from '$lib/types';

export async function fetchUsers() {
	return supabase.from('users').select('id, name').order('name');
}

export async function fetchWishes(userId: string) {
	return supabase.from('wishes').select('*').eq('user_id', userId);
}

export async function fetchPurchasesFor(ids: string[]) {
	if (!ids.length) return { data: [], error: null };
	return supabase.from('purchased').select('*').in('wish_id', ids);
}

export async function insertWish(userId: string, payload: WishInput) {
	return supabase
		.from('wishes')
		.insert({
			user_id: userId,
			...payload
		})
		.select()
		.single();
}

export async function updateWish(wishId: string, payload: WishInput) {
	return supabase.from('wishes').update(payload).eq('id', wishId).select().single();
}

export async function removeWish(wishId: string) {
	return supabase.from('wishes').delete().eq('id', wishId);
}

export async function insertPurchase(wishId: string, userId: string) {
	return supabase
		.from('purchased')
		.insert({ wish_id: wishId, user_id: userId })
		.select()
		.single();
}

export async function removePurchase(purchaseId: string) {
	return supabase.from('purchased').delete().eq('id', purchaseId);
}

export function sortWishes(list: Wish[], mode: SortMode) {
	return [...list].sort((a, b) => {
		if (mode === 'priority') {
			return (a.priority ?? 0) - (b.priority ?? 0) || new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
		}
		if (mode === 'title') {
			return a.title.localeCompare(b.title);
		}
		return new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
	});
}

export function priorityStars(priority: number | null) {
	return '★'.repeat(Math.max(1, Math.min(3, priority ?? 1)));
}
