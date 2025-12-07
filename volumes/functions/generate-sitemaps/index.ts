import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as db from "./db.ts";
import { buildSitemap, buildSitemapIndex, SitemapEntry } from "./sitemap.ts";
import { uploadGzip } from "./storage.ts";
import { gzipEncode } from "./sitemap.ts";
import { defaultLocale, supportedLocales } from "../_shared/locales.ts";
import { slugify } from "./slugify.ts";
import { SUPABASE_SERVICE_ROLE_KEY } from "../_shared/supabase-admin.ts";

const SITE_URL = Deno.env.get("SITE_URL")!;
const SITEMAP_BASE_URL = `${SITE_URL}/sitemaps`;

async function generateMovieSitemaps() {
    console.log("Generating movie sitemaps...");
    const count = await db.getSitemapMediaMovieCount();
    const sitemapIndexes = Array.from({ length: count }, (_, i) => `${SITEMAP_BASE_URL}/films/${i}`);

    const sitemapIndexXML = buildSitemapIndex(sitemapIndexes);
    await uploadGzip(`movies/index.xml.gz`, gzipEncode(sitemapIndexXML));

    for (let i = 0; i < count; i++) {
        const movies = await db.getSitemapMediaMovies(i);
        const sitemapEntries: SitemapEntry[] = movies.map((film) => {
            const translations = Object.fromEntries(
                (film.tmdb_movie_translations || []).map((t) => [`${t.iso_639_1}-${t.iso_3166_1}`, t.title])
            );

            const defaultTitle = translations[defaultLocale] || film.original_title;
            const defaultSlugUrl = `${film.id}${defaultTitle ? `-${slugify(defaultTitle)}` : ''}`;

            const languageUrls = Object.fromEntries(
                supportedLocales.map((locale) => {
                    const title = translations[locale] || film.original_title;
                    const slug = `${film.id}${title ? `-${slugify(title)}` : ''}`;
                    const url = (locale === defaultLocale)
                        ? `${SITE_URL}/film/${slug}`
                        : `${SITE_URL}/${locale}/film/${slug}`;
                    return [locale, url];
                })
            );

            return {
                url: `${SITE_URL}/film/${defaultSlugUrl}`,
                priority: 0.8,
                alternates: {
                    languages: languageUrls,
                },
            };
        });
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`movies/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded movies/${i}.xml.gz`);
    }
    console.log("Finished movie sitemaps.");
}

async function generateTvSeriesSitemaps() {
    console.log("Generating TV series sitemaps...");
    const count = await db.getSitemapMediaTvSeriesCount();
    const sitemapIndexes = Array.from({ length: count }, (_, i) => `${SITEMAP_BASE_URL}/tv-series/${i}`);
    
    const sitemapIndexXML = buildSitemapIndex(sitemapIndexes);
    await uploadGzip(`tv-series/index.xml.gz`, gzipEncode(sitemapIndexXML));

    for (let i = 0; i < count; i++) {
        const series = await db.getSitemapMediaTvSeries(i);
        const sitemapEntries: SitemapEntry[] = series.map((tv) => {
            const translations = Object.fromEntries(
                (tv.tmdb_tv_series_translations || []).map((t) => [`${t.iso_639_1}-${t.iso_3166_1}`, t.name])
            );

            const defaultName = translations[defaultLocale] || tv.original_name;
            const defaultSlugUrl = `${tv.id}${defaultName ? `-${slugify(defaultName)}` : ''}`;
            
            const languageUrls = Object.fromEntries(
                supportedLocales.map((locale) => {
                    const name = translations[locale] || tv.original_name;
                    const slug = `${tv.id}${name ? `-${slugify(name)}` : ''}`;
                    const url = (locale === defaultLocale)
                        ? `${SITE_URL}/tv-series/${slug}`
                        : `${SITE_URL}/${locale}/tv-series/${slug}`;
                    return [locale, url];
                })
            );

            return {
                url: `${SITE_URL}/tv-series/${defaultSlugUrl}`,
                priority: 0.8,
                alternates: {
                    languages: languageUrls,
                },
            };
        });
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`tv-series/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded tv-series/${i}.xml.gz`);
    }
    console.log("Finished TV series sitemaps.");
}

async function generateUserSitemaps() {
    console.log("Generating user sitemaps...");
    const count = await db.getSitemapUserCount();
    const sitemapIndexes = Array.from({ length: count }, (_, i) => `${SITEMAP_BASE_URL}/users/${i}`);

    const sitemapIndexXML = buildSitemapIndex(sitemapIndexes);
    await uploadGzip(`users/index.xml.gz`, gzipEncode(sitemapIndexXML));

    for (let i = 0; i < count; i++) {
        const users = await db.getSitemapUsers(i);
        const sitemapEntries: SitemapEntry[] = users.map((user) => ({
            url: `${SITE_URL}/@${user.username}`,
            lastModified: user.created_at,
            priority: 0.6,
        }));
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`users/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded users/${i}.xml.gz`);
    }
    console.log("Finished user sitemaps.");
}

async function generatePlaylistSitemaps() {
    console.log("Generating playlist sitemaps...");
    const count = await db.getSitemapPlaylistCount();
    const sitemapIndexes = Array.from({ length: count }, (_, i) => `${SITEMAP_BASE_URL}/playlists/${i}`);

    const sitemapIndexXML = buildSitemapIndex(sitemapIndexes);
    await uploadGzip(`playlists/index.xml.gz`, gzipEncode(sitemapIndexXML));

    for (let i = 0; i < count; i++) {
        const playlists = await db.getSitemapPlaylists(i);
        const sitemapEntries: SitemapEntry[] = playlists.map((playlist) => ({
            url: `${SITE_URL}/playlist/${playlist.id}`,
            lastModified: playlist.updated_at,
            priority: 0.7,
        }));
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`playlists/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded playlists/${i}.xml.gz`);
    }
    console.log("Finished playlist sitemaps.");
}

async function generateReviewSitemaps() {
    console.log("Generating review sitemaps...");
    const movieReviewCount = await db.getSitemapReviewMovieCount();
    const tvReviewCount = await db.getSitemapReviewTvSeriesCount();

    const movieReviewSitemaps = Array.from({ length: movieReviewCount }, (_, i) => `${SITEMAP_BASE_URL}/reviews/movie/${i}`);
    const tvReviewSitemaps = Array.from({ length: tvReviewCount }, (_, i) => `${SITEMAP_BASE_URL}/reviews/tv-series/${i}`);

    const reviewIndexXML = buildSitemapIndex([...movieReviewSitemaps, ...tvReviewSitemaps]);
    await uploadGzip(`reviews/index.xml.gz`, gzipEncode(reviewIndexXML));
    console.log(`  - Uploaded reviews/index.xml.gz`);

    // Movie Reviews
    for (let i = 0; i < movieReviewCount; i++) {
        const reviews = await db.getSitemapReviewsMovie(i);
        const sitemapEntries: SitemapEntry[] = reviews
            .filter(r => r.activity?.movie_id)
            .map((review) => ({
                url: `${SITE_URL}/film/${review.activity!.movie_id}/review/${review.id}`,
                lastModified: review.updated_at,
                changeFrequency: "daily",
                priority: 0.8,
            }));
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`reviews/movie/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded reviews/movie/${i}.xml.gz`);
    }

    // TV Series Reviews
    for (let i = 0; i < tvReviewCount; i++) {
        const reviews = await db.getSitemapReviewsTvSeries(i);
        const sitemapEntries: SitemapEntry[] = reviews
            .filter(r => r.activity?.tv_series_id)
            .map((review) => ({
                url: `${SITE_URL}/tv-series/${review.activity!.tv_series_id}/review/${review.id}`,
                lastModified: review.updated_at,
                changeFrequency: "daily",
                priority: 0.8,
            }));
        const sitemapXML = buildSitemap(sitemapEntries);
        await uploadGzip(`reviews/tv-series/${i}.xml.gz`, gzipEncode(sitemapXML));
        console.log(`  - Uploaded reviews/tv-series/${i}.xml.gz`);
    }
    console.log("Finished review sitemaps.");
}

serve(async (req) => {
	const authorization = req.headers.get("Authorization");
	if (authorization !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
		return new Response("Unauthorized", { status: 401 });
	}
    if (!SITE_URL) {
        return new Response("SITE_URL environment variable is not set.", { status: 500 });
    }
    try {
        await Promise.all([
            generateMovieSitemaps(),
            generateTvSeriesSitemaps(),
            generateUserSitemaps(),
            generatePlaylistSitemaps(),
            generateReviewSitemaps(),
        ]);
        await db.sql.end();
        return new Response("Sitemaps generated successfully.", { status: 200 });
    } catch (error) {
        console.error("Error generating sitemaps:", error);
        await db.sql.end();
		if (error instanceof Error) {
			return new Response(`Error generating sitemaps: ${error.message}`, { status: 500 });
		}
		return new Response("Unknown error generating sitemaps.", { status: 500 });
    }
});