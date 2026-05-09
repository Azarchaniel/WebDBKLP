import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
    plugins: [
        react(),
        svgr(),
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
    },
});
