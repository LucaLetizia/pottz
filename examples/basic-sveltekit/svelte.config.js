import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
		experimental: {
			async: true
		}
	},
	kit: {
		csrf: { trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : [] },
		experimental: {
			remoteFunctions: true
		},
		adapter: adapter()
	}
};

export default config;
