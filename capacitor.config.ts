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
    },
    Keyboard: {
      "resize": "none"
    },
    LocalNotifications: {
      largeIcon: "notification_logo",
      smallIcon: "notification_icon",
      iconColor: "#03A9F4"
    }
  },
  backgroundColor: {
    light: "#FFFFFF",
    dark: "#080808"
  }
};

export default config;
