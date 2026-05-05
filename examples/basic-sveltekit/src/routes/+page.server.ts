import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		serverStatus: 'Still running somehow'
	};
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const incidentSummary = data.get('incident-summary');
		const incidentCausedBy = data.get('incident-caused-by');

		return { incidentSummary, incidentCausedBy, success: true };
	}
} satisfies Actions;
