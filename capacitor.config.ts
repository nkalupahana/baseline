import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "la.nisa.moody",
  appName: "moody",
  webDir: "build",
  bundledWebRuntime: false,
  ios: {
    scheme: "moody"
  },
  plugins: {
    FirebaseAuthentication: {
      "skipNativeAuth": true,
      "providers": ["apple.com", "google.com"]
    }
  }
};

export default config;
