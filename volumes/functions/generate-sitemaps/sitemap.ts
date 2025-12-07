import { gzip } from "https://deno.land/x/compress@v0.4.1/mod.ts";

export type AlternateLanguages = Record<string, string>;

export type SitemapEntry = {
	url: string;
	lastModified?: string | Date;
	changeFrequency?: 
		| "always"
		| "hourly"
		| "daily"
		| "weekly"
		| "monthly"
		| "yearly"
		| "never";
	priority?: number;
	alternates?: {
		languages?: AlternateLanguages;
	};
};

export const buildSitemapIndex = (sitemaps: string[]): string => {
	let xml = '<?xml version="1.0" encoding="UTF-8"?>';
	xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

	for (const sitemapURL of sitemaps) {
		xml += "<sitemap>";
		xml += `<loc>${sitemapURL}</loc>`;
		xml += "</sitemap>";
	}

	xml += "</sitemapindex>";
	return xml;
};

export const buildSitemap = (urls: SitemapEntry[]): string => {
	let xml = '<?xml version="1.0" encoding="UTF-8"?>';
	xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `;
	xml += `xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

	for (const url of urls) {
		xml += "<url>";

		xml += `<loc>${url.url}</loc>`;

		if (url.lastModified) {
		const d = new Date(url.lastModified);
		xml += `<lastmod>${d.toISOString()}</lastmod>`;
		}

		if (url.changeFrequency) {
		xml += `<changefreq>${url.changeFrequency}</changefreq>`;
		}

		if (url.priority) {
		xml += `<priority>${url.priority}</priority>`;
		}

		if (url.alternates?.languages) {
		for (const [lang, loc] of Object.entries(url.alternates.languages)) {
			xml += `<xhtml:link rel="alternate" hreflang="${lang}" href="${loc}" />`;
		}
		}

		xml += "</url>";
	}

	xml += "</urlset>";
	return xml;
};

export function gzipEncode(text: string): Uint8Array {
	return gzip(new TextEncoder().encode(text));
}
