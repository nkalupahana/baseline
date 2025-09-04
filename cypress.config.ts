import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    testIsolation: false,
    video: true,
    videoCompression: true,
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    baseUrl: "http://localhost:8100",
  },
  component: {
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    devServer: {
      framework: "create-react-app",
      bundler: "webpack",
    }
  }
});
