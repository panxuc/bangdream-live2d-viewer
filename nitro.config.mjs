import { defineNitroConfig } from "nitro/config";

const immutableCacheHeaders = {
  "cache-control": "public, max-age=31536000, immutable",
};

export default defineNitroConfig({
  preset: process.env.VERCEL ? "vercel" : "node-server",
  serverDir: "src/server",
  compatibilityDate: "2026-03-19",
  routeRules: {
    "/7zz.umd.js": { headers: immutableCacheHeaders },
    "/7zz.wasm": { headers: immutableCacheHeaders },
    "/libarchive.js": { headers: immutableCacheHeaders },
    "/libarchive.wasm": { headers: immutableCacheHeaders },
    "/live2d.min.js": { headers: immutableCacheHeaders },
    "/live2dcubismcore.min.js": { headers: immutableCacheHeaders },
  },
});
