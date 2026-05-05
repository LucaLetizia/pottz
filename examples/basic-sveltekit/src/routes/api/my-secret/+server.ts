import { getInternalConfig } from '$lib/server/secrets';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
	// This is only to demo server-only modules
	// You shouldn't return secrets to the client
	return json(getInternalConfig());
};
