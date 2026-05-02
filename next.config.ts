import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  // Silence the Turbopack/webpack conflict from the PWA plugin
  turbopack: {},
};

export default withPWA(nextConfig);
