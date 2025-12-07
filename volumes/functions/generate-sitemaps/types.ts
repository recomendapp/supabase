export type Movie = {
	id: number;
	original_title: string;
	tmdb_movie_translations: {
		iso_639_1: string;
		iso_3166_1: string;
		title: string;
	}[];
};

export type TvSeries = {
	id: number;
	original_name: string;
	tmdb_tv_series_translations: {
		iso_639_1: string;
		iso_3166_1: string;
		name: string;
	}[];
};

export type Profile = {
	id: string;
	username: string;
	created_at: string;
};

export type Playlist = {
	id: string;
	title: string;
	updated_at: string;
};

export type ReviewMovie = {
	id: string;
	updated_at: string;
	activity: { movie_id: number } | null;
};

export type ReviewTvSeries = {
	id: string;
	updated_at: string;
	activity: { tv_series_id: number } | null;
};