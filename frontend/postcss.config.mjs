import { fileURLToPath } from "node:url";

const base = fileURLToPath(new URL(".", import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": { base },
  },
};

export default config;
