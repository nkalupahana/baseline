import { defineConfig } from "cypress";

export default defineConfig({
  videoCompression: false,
  e2e: {
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
