import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        svgr(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["img/favicon.ico", "img/icons/*.png", "img/*.svg"],
            manifest: {
                name: "WebDBKLP",
                short_name: "DBKLP",
                description: "Personal database for books, LPs, board games, quotes and authors",
                theme_color: "#00ADB5",
                background_color: "#ffffff",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "img/icons/base-128x128.ico",
                        sizes: "128x128",
                        type: "image/x-icon",
                    },
                    {
                        src: "img/icons/base-512x512.ico",
                        sizes: "512x512",
                        type: "image/x-icon",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https?:\/\/.*\/api\/(books|autors|lps|boardgames|quotes)(\?.*)?$/,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "api-collections",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24, // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@styles": path.resolve(__dirname, "src/styles"),
            "@components": path.resolve(__dirname, "src/components"),
            "@utils": path.resolve(__dirname, "src/utils"),
            "@hooks": path.resolve(__dirname, "src/utils/hooks/index.ts"),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern",
            },
        },
    },
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
    define: {
        // Compatibility shim for vendored libs that reference process.env.NODE_ENV
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    },
    build: {
        outDir: "build",
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React runtime — cached aggressively
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    // i18n
                    "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
                    // Date utilities (large)
                    "vendor-date": ["date-fns", "react-datepicker"],
                    // Table libraries
                    "vendor-table": ["@tanstack/react-table", "@material-table/core"],
                    // UI / styling
                    "vendor-ui": ["react-toastify", "react-tooltip", "styled-components", "react-simple-wysiwyg"],
                    // HTTP + state
                    "vendor-http": ["axios", "redux"],
                    // FontAwesome
                    "vendor-icons": [
                        "@fortawesome/fontawesome-svg-core",
                        "@fortawesome/free-solid-svg-icons",
                        "@fortawesome/react-fontawesome",
                    ],
                },
            },
        },
    },
});
