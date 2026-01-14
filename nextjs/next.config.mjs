const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'r2.binbino.cn',
      },
      {
        protocol: 'https',
        hostname: 'api.binbino.cn',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_WORKER_URL: process.env.NEXT_PUBLIC_WORKER_URL || 'https://api.binbino.cn',
    NEXT_PUBLIC_R2_URL: process.env.NEXT_PUBLIC_R2_URL || 'https://r2.binbino.cn',
  },
};

export default nextConfig;
