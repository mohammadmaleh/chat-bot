import type { Config } from "tailwindcss";
import uiConfig from "@chatbot/ui/tailwind.config";

const config: Config = {
  ...uiConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
