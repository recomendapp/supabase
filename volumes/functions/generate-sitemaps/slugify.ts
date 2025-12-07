export const slugify = (str: string): string => {
	if (!str) return "";
	let s = str.toLowerCase();
	s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	s = s.replace(/[^a-z0-9\-_]+/g, "-");
	s = s.replace(/^-+|-+$/g, "");
	return s;
}