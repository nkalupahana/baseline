import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.getbaseline.baseline",
  appName: "baseline",
  webDir: "build",
  bundledWebRuntime: false,
  ios: {
    scheme: "baseline"
  },
  plugins: {
    FirebaseAuthentication: {
      "skipNativeAuth": true,
      "providers": ["apple.com", "google.com"]
    }
  }
};

export default config;
