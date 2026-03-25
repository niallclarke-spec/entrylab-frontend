import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Replit dev origin
  allowedDevOrigins: ["*.riker.replit.dev"],

  // Image optimization — allow external broker logos
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // All 301 redirects from old URL structure
  async redirects() {
    return [
      // Old singular → plural
      { source: "/broker/:slug", destination: "/brokers/:slug", permanent: true },
      { source: "/broker/:slug/:article", destination: "/brokers/:slug/:article", permanent: true },
      { source: "/prop-firm/:slug", destination: "/prop-firms/:slug", permanent: true },

      // Old category URLs → listing pages
      { source: "/top-cfd-brokers", destination: "/brokers", permanent: true },
      { source: "/top-3-cfd-brokers", destination: "/brokers", permanent: true },
      { source: "/best-verified-propfirms", destination: "/prop-firms", permanent: true },
      { source: "/brokers/best-cfd", destination: "/brokers", permanent: true },
      { source: "/brokers/top-3-cfd", destination: "/brokers", permanent: true },
      { source: "/prop-firms/best-verified", destination: "/prop-firms", permanent: true },

      // Old article paths → new structure
      { source: "/learn/:category/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/topics/news", destination: "/news", permanent: true },
      { source: "/topics/broker-news", destination: "/news", permanent: true },
      { source: "/topics/prop-firm-news", destination: "/news", permanent: true },
      { source: "/topics/broker-guides", destination: "/learn", permanent: true },
      { source: "/topics/prop-firm-guides", destination: "/learn", permanent: true },
      { source: "/topics/trading-tools", destination: "/learn", permanent: true },
      { source: "/topics/:slug", destination: "/blog", permanent: true },

      // Old comparison paths → flat /compare
      { source: "/brokers/compare", destination: "/compare", permanent: true },
      { source: "/brokers/compare/:slug", destination: "/compare/:slug", permanent: true },
      { source: "/prop-firms/compare", destination: "/compare", permanent: true },
      { source: "/prop-firms/compare/:slug", destination: "/compare/:slug", permanent: true },
      { source: "/compare/broker", destination: "/compare", permanent: true },
      { source: "/compare/prop-firm", destination: "/compare", permanent: true },
      { source: "/compare/broker/:slug", destination: "/compare/:slug", permanent: true },
      { source: "/compare/prop-firm/:slug", destination: "/compare/:slug", permanent: true },

      // WordPress legacy
      { source: "/popular_broker/:slug", destination: "/brokers/:slug", permanent: true },
      { source: "/popular-brokers/:slug", destination: "/brokers/:slug", permanent: true },
      { source: "/category/:slug", destination: "/blog", permanent: true },

      // Old news/category root URLs
      { source: "/broker-news", destination: "/news", permanent: true },
      { source: "/prop-firm-news", destination: "/news", permanent: true },
      { source: "/broker-guides", destination: "/learn", permanent: true },
      { source: "/prop-firm-guides", destination: "/learn", permanent: true },
      { source: "/trading-tools", destination: "/learn", permanent: true },
    ];
  },
};

export default nextConfig;
