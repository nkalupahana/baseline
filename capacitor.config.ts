import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.getbaseline.baseline",
  appName: "baseline",
  webDir: "build",
  ios: {
    scheme: "baseline"
  },
  plugins: {
    FirebaseAuthentication: {
      "skipNativeAuth": true,
      "providers": ["apple.com", "google.com"]
    },
    Keyboard: {
      // to stop webview resizing on iOS, which causes
      // weird rendering when going from WriteJournal to FinishJournal
      // Because of the status bar plugin, on Android, the webview
      // doesn't resize by default
      "resize": "none",
    },
    LocalNotifications: {
      largeIcon: "notification_logo",
      smallIcon: "notification_icon",
      iconColor: "#03A9F4",
    }
  }
};

export default config;
