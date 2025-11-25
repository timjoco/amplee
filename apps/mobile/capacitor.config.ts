import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.amplee',
  appName: 'Amplee',
  webDir: 'dist',
  server: { url: 'http://192.168.1.119:5173', cleartext: true },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
