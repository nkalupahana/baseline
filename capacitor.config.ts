import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'la.nisa.moody',
  appName: 'moody',
  webDir: 'build',
  bundledWebRuntime: false,
  ios: {
    scheme: "moody"
  },
  cordova: {
    staticPlugins: [
      'cordova-plugin-googleplus',
    ]
  }
};

export default config;
