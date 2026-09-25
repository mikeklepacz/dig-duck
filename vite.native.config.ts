import { defineConfig, mergeConfig } from "vite";
import webConfig from "./vite.config";

export default mergeConfig(webConfig, defineConfig({
  build: {
    outDir: "macos/Generated/Web",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: { output: { format: "iife", inlineDynamicImports: true } }
  },
  plugins: [{
    name: "native-offline-html",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // A single classic bundle works with file URLs in WKWebView without
        // relaxing WebKit's file-origin protections or using private APIs.
        return html.replace(/type="module" crossorigin/g, "defer")
          .replace(/ crossorigin/g, "")
          .replace("<head>", `<head>\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'">`);
      }
    }
  }]
}));
