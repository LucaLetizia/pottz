/** @type {import('pottz').PottzConfig} */
export default {
  //onStartup: async () => {},
  window: {
    title: 'My App',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  },
  build: {
    targets: ['linux-x64', 'windows-x64'],
    outDir: 'dist',
    appName: 'my-app',
    windows: {
      // Path to your .ico file - only applied when building on Windows
      //icon: './src/lib/assets/your-icon.ico',
      title: 'My App',
      publisher: 'Your Name',
      version: '1.0.0',
      description: 'My SvelteKit desktop app',
      copyright: 'Copyright 2026',
    }
  },
  adapter: {
    // Must match the 'out' option in your adapter-node config
    // Only change this if you've customised adapter-node's out option
    out: 'build',
    // Must match the 'envPrefix' option in your adapter-node config
    envPrefix: '',
  }
};
