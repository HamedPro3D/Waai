import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: "#25D366",
          dark: "#075E54"
        }
      }
    }
  },
  plugins: []
};

export default config;
