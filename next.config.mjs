/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /*
     * Navigations become cuts. The View Transitions API snapshots the old
     * page and the new one and lets CSS choreograph the swap — the browser
     *-native version of the film grammar this site already speaks. Browsers
     * without it simply navigate; nothing is lost, only the cut.
     */
    viewTransition: true,
  },
  reactStrictMode: true,
  // three.js ships untranspiled ESM examples; Next needs to compile them.
  transpilePackages: ['three'],
};

export default nextConfig;
