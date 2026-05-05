import { TOKEN_ALIAS } from '$env/static/private';
import { PUBLIC_APP_NAME, PUBLIC_ENVIRONMENT } from '$env/static/public';

export function getInternalConfig() {
	return {
		secret: 'Have you tried restarting it?',
		env: PUBLIC_ENVIRONMENT,
		tokenAlias: TOKEN_ALIAS,
		appName: PUBLIC_APP_NAME
	};
}
