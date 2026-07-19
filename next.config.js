/** @type {import('next').NextConfig} */
const nextConfig = {
  // swcMinify: false

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'gvfkrxicahqgbvouongk.supabase.co',
      },
    ],
  },

  // Fix source map issues - disable to prevent parsing errors
  productionBrowserSourceMaps: false,
  
  // Turbopack configuration (Next.js 16 default)
  // Note: Turbopack doesn't have direct source map disable option
  // The errors are non-fatal and can be ignored
  turbopack: {},
  
  // Webpack configuration (for when using --webpack flag)
  webpack: (config, { dev, isServer }) => {
    // Completely disable source maps to prevent parsing errors
    config.devtool = false;
    
    // Suppress all source map warnings and errors
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /node_modules/ },
      /Failed to parse source map/,
      /Invalid source map/,
      /sourceMapURL could not be parsed/,
    ];

    // Remove source-map-loader if present to prevent source map parsing
    if (config.module && config.module.rules) {
      config.module.rules = config.module.rules.filter(
        (rule) => !(rule.use && Array.isArray(rule.use) && rule.use.some((use) => use === 'source-map-loader' || (typeof use === 'object' && use.loader === 'source-map-loader')))
      );
    }

    return config;
  },
};

module.exports = nextConfig;
