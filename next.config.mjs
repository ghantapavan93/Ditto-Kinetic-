/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM examples; Next needs to compile them.
  transpilePackages: ['three'],
};

export default nextConfig;
