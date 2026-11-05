/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@devpulse/contracts", "@devpulse/curriculum"],
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com"],
  },
};

export default nextConfig;

