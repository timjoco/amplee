import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.amplee',
  appName: 'Amplee',
  webDir: 'dist',
  ios: {
    scrollEnabled: false,
  },
  // server: { url: 'http://192.168.1.113:5173/', cleartext: true },
  plugins: {
    Keyboard: {
      resize: 'none',
      scrollPadding: false,
    },
  },
};

export default config;
