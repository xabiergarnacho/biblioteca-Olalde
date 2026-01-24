import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Configurar Turbopack explícitamente para evitar conflictos
  turbopack: {},
};

export default nextConfig;
