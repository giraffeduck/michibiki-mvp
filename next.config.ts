import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 他の設定がある場合はここに追加してOK
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
