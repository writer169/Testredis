/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    // Будет доступно только на сервере
  },
  publicRuntimeConfig: {
    // Будет доступно и на клиенте и на сервере
  },
  // Важно: указываем, что эти пути работают только на стороне сервера
  serverComponentsExternalPackages: ['redis'],
};

module.exports = nextConfig;