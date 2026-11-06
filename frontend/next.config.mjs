/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@devpulse/contracts", "@devpulse/curriculum"],
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com"],
  },
  webpack: (config) => {
    // SECURITY (Phase 5, decision D6): defense in depth. The PRIMARY D6
    // guarantee is structural: client modules import the browser-safe
    // `@devpulse/contracts/src/shared-schemas` surface (see that file) —
    // the graded-truth bank schema lives ONLY in the server barrel, so no
    // client graph can reach it. This rule additionally restores tree-shaking
    // for anyone who later imports the barrel from client code: under
    // `transpilePackages` the package.json `sideEffects: false` flag would
    // otherwise be ignored (zod builder calls cannot be proven pure, so dead
    // statements inside an included barrel still ship). The artifact scanner
    // (`scripts/check-production-bundle.mjs`) fails the build otherwise.
    config.module.rules.push({
      // Matches both the workspace-realpath (…\shared\contracts\src\index.ts,
      // what resolve.symlinks records under transpilePackages) and a possible
      // node_modules-style @devpulse/… specifier, for contracts AND curriculum
      // barrels (both pure schema/data modules).
      test: /[\\/](shared|@devpulse)[\\/](contracts|curriculum)[\\/]src[\\/]index\.ts$/,
      sideEffects: false,
    });
    return config;
  },
};

export default nextConfig;
