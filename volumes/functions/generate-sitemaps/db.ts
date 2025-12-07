import postgres from "https://deno.land/x/postgresjs/mod.js";
import { Movie, Playlist, ReviewMovie, TvSeries, ReviewTvSeries, Profile } from "./types.ts";

const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

export const sql = postgres(SUPABASE_DB_URL, { ssl: false });

/* ---------------------------------- USERS --------------------------------- */
const USER_PER_PAGE = 10000;

export async function getSitemapUserCount(perPage: number = USER_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM profile WHERE private = false`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

export async function getSitemapUsers(id: number, perPage: number = USER_PER_PAGE): Promise<Profile[]> {
    const start = id * perPage;
    return await sql`
        SELECT username, created_at FROM profile
        WHERE private = false
        ORDER BY created_at ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}
/* -------------------------------------------------------------------------- */

/* --------------------------------- MEDIAS --------------------------------- */
// Movies
const MEDIA_MOVIE_PER_PAGE = 10000;

export async function getSitemapMediaMovieCount(perPage: number = MEDIA_MOVIE_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM tmdb_movie`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

// Assumes 'tmdb_movie_translations' table has a 'movie_id' foreign key to 'tmdb_movie.id'
export async function getSitemapMediaMovies(id: number, perPage: number = MEDIA_MOVIE_PER_PAGE): Promise<Movie[]> {
    const start = id * perPage;
    return await sql`
        SELECT
            m.id,
            m.original_title,
            COALESCE(
                (
                    SELECT json_agg(json_build_object('iso_639_1', t.iso_639_1, 'iso_3166_1', t.iso_3166_1, 'title', t.title))
                    FROM tmdb_movie_translations t
                    WHERE t.movie_id = m.id
                ),
                '[]'::json
            ) as tmdb_movie_translations
        FROM tmdb_movie m
        ORDER BY m.id ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}

// TV Series
const MEDIA_TV_SERIES_PER_PAGE = 10000;

export async function getSitemapMediaTvSeriesCount(perPage: number = MEDIA_TV_SERIES_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM tmdb_tv_series`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

export async function getSitemapMediaTvSeries(id: number, perPage: number = MEDIA_TV_SERIES_PER_PAGE): Promise<TvSeries[]> {
    const start = id * perPage;
    return await sql`
        SELECT
            tv.id,
            tv.original_name,
            COALESCE(
                (
                    SELECT json_agg(json_build_object('iso_639_1', t.iso_639_1, 'iso_3166_1', t.iso_3166_1, 'name', t.name))
                    FROM tmdb_tv_series_translations t
                    WHERE t.serie_id = tv.id
                ),
                '[]'::json
            ) as tmdb_tv_series_translations
        FROM tmdb_tv_series tv
        ORDER BY tv.id ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}
/* -------------------------------------------------------------------------- */

/* -------------------------------- PLAYLISTS ------------------------------- */
const PLAYLIST_PER_PAGE = 10000;

export async function getSitemapPlaylistCount(perPage: number = PLAYLIST_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM playlists`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

export async function getSitemapPlaylists(id: number, perPage: number = PLAYLIST_PER_PAGE): Promise<Playlist[]> {
    const start = id * perPage;
    return await sql`
        SELECT id, title, updated_at FROM playlists
        ORDER BY id ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}
/* -------------------------------------------------------------------------- */

/* --------------------------------- REVIEWS -------------------------------- */
const REVIEW_PER_PAGE = 10000;

export async function getSitemapReviewMovieCount(perPage: number = REVIEW_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM user_reviews_movie`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

export async function getSitemapReviewTvSeriesCount(perPage: number = REVIEW_PER_PAGE): Promise<number> {
    const result = await sql`SELECT COUNT(id) as count FROM user_reviews_tv_series`;
    const count = Number(result[0].count);
    return count ? Math.ceil(count / perPage) : 0;
}

export async function getSitemapReviewsMovie(id: number, perPage: number = REVIEW_PER_PAGE): Promise<ReviewMovie[]> {
    const start = id * perPage;
    return await sql`
        SELECT
            r.id,
            r.updated_at,
            (
                SELECT json_build_object('movie_id', a.movie_id)
                FROM user_activities_movie a
                WHERE a.id = r.id
            ) as activity
        FROM user_reviews_movie r
        ORDER BY r.created_at ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}

export async function getSitemapReviewsTvSeries(id: number, perPage: number = REVIEW_PER_PAGE): Promise<ReviewTvSeries[]> {
    const start = id * perPage;
    return await sql`
        SELECT
            r.id,
            r.updated_at,
            (
                SELECT json_build_object('tv_series_id', a.tv_series_id)
                FROM user_activities_tv_series a
                WHERE a.id = r.id
            ) as activity
        FROM user_reviews_tv_series r
        ORDER BY r.created_at ASC
        LIMIT ${perPage} OFFSET ${start}
    `;
}
/* -------------------------------------------------------------------------- */
