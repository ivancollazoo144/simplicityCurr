import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo; no debe empaquetarse en el bundle del servidor.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
