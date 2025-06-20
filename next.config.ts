import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    WEAVIATE_URL: process.env.WEAVIATE_URL,
    WEAVIATE_API_KEY: process.env.WEAVIATE_API_KEY,
  },
};

console.log("Next.js config - Using Weaviate URL:", process.env.WEAVIATE_URL);
console.log(
  "Next.js config - Using Weaviate API Key:",
  process.env.WEAVIATE_API_KEY ? "***REDACTED***" : "undefined"
);

export default nextConfig;
