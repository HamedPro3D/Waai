/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 usa un binario nativo, así que le decimos a Next.js
  // que no intente empaquetarlo para el servidor.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"]
  }
};

module.exports = nextConfig;
