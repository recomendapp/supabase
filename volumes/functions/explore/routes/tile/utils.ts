import { supabaseAdmin } from "../../utils/supabase.ts";

export const getExploreItems = async (exploreId: string, lang: string) => {
	const batchSize = 500;
	let from = 0;
	let allItems: any[] = [];
	let fetched = 0;
	do {
		const { data, error } = await supabaseAdmin
			.from('explore_items')
			.select(`
				id,
				location,
				movie:media_movie (
					id,
					title,
					poster_path,
					poster_url,
					release_date,
					runtime,
					genres
				)
			`)
			.eq('explore_id', exploreId)
			.range(from, from + batchSize - 1)
			.setHeader('language', lang);

		if (error) throw error;

		fetched = data?.length ?? 0;
		allItems.push(...data);
		from += batchSize;
	} while (fetched >= batchSize);

	return allItems;
}