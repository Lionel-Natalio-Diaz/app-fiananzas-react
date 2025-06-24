import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fintouch.app',
  appName: 'Fintouch',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    permissions: [
      {
        alias: 'microphone',
        name: 'android.permission.RECORD_AUDIO',
      },
    ]
  }
};

export default config;
