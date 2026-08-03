/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  outputFileTracingRoot: __dirname,
};
module.exports = nextConfig;
