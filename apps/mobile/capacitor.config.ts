import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.amplee',
  appName: 'Amplee',
  webDir: 'dist',
  server: { url: 'http://192.168.1.113:5173', cleartext: true },
};

export default config;
