import { query } from '$app/server';

export const getReleaseNotes = query(() => {
	const releaseNotes = {
		version: '2.4.1',
		notes: 'Fixed one bug|Added three new bugs|Improved loading speed*|*For localhost only'
	};
	return releaseNotes;
});
