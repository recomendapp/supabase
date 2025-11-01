import type { Context } from 'jsr:@hono/hono'
import { z } from 'npm:zod';
import { supabaseAdmin } from '../../utils/supabase.ts';
import { getExploreItems } from './utils.ts';

const GetTileSchema = z.object({
	exploreId: z.string().nonempty(),
	lang: z.string().optional(),
});

export const handleGetTile = async (c: Context) => {
	try {
		const queryParams = c.req.query();
		const {
			exploreId,
			lang = 'en-US',
		} = GetTileSchema.parse(queryParams);

		// Check if language is supported
		const { data: isSupported } = await supabaseAdmin
			.rpc('utils_is_supported_language', { lang: lang });
		if (!isSupported) {
			return c.json({ error: 'Language not supported' }, 400);
		}

		// Get explore metadata
		const { data: exploreMetadata, error: metaError } = await supabaseAdmin
			.from('explore')
			.select('*')
			.eq('id', exploreId)
			.single();
		if (metaError || !exploreMetadata) {
			return c.json({ error: 'Explore not found' }, 404);
		}

		// Path
		const storagePath = `${exploreId}/${lang}.geojson`;
		const { data: storedTile } = await supabaseAdmin
			.storage
			.from('explore_tiles')
			.download(storagePath);
		if (storedTile) {
			const geojsonText = await storedTile.text();
			const geojson = JSON.parse(geojsonText);

			if (geojson.updated_at === exploreMetadata.updated_at) {
				return c.json(geojson);
			}
			
			console.log(`[ExploreTile] Rebuilding outdated tile ${exploreId} (${lang})`);
		}

		// Get data from DB
		const dbData = await getExploreItems(exploreId, lang);

		// Construct GeoJSON
		const geojson = {
			type: 'FeatureCollection',
			updated_at: exploreMetadata.updated_at,
			features: dbData.map((item) => ({
				type: 'Feature',
				geometry: item.location,
				properties: {
					id: item.id,
					movie: {
						...item.movie,
						genres_ids: item.movie.genres.map((g: { id: string }) => g.id),
					},
				},
			})),
		};

		// Store tile in Supabase Storage
		const { error: uploadError } = await supabaseAdmin
			.storage
			.from('explore_tiles')
			.upload(
				storagePath,
				new Blob([JSON.stringify(geojson)], { type: 'application/json' }),
				{ upsert: true }
			);
		if (uploadError) {
			console.error('Error uploading tile:', uploadError);
		}

		return c.json(geojson);
	} catch (err) {
		console.error(err);
		return c.json({ error: 'Invalid request' }, 400);
	}
}
