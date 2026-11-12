/** @type {import('next').NextConfig} */
const nextConfig = {
  // dev: allow hydration/RSC requests from local hosts (Next 16 blocks other origins)
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
