import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: "firebase-auth-vendor",
              test: /node_modules[\\/]@firebase[\\/]auth[\\/]/,
              priority: 30,
            },
            {
              name: "firebase-firestore-vendor",
              test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/,
              priority: 30,
            },
            {
              name: "firebase-core-vendor",
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 20,
            },
            {
              name: "supabase-vendor",
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 20,
            },
            {
              name: "drag-drop-vendor",
              test: /node_modules[\\/]@dnd-kit[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});
