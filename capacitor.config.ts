import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'la.nisa.moody',
  appName: 'moody',
  webDir: 'build',
  bundledWebRuntime: false,
  cordova: {
    staticPlugins: [
      'cordova-plugin-googleplus',
    ]
  }
};

export default config;
