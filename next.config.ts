import type { NextConfig } from 'next';

// Media is served from our own server via /api/admin/file, so no remote image
// hosts are needed. App Router route handlers stream the request body straight
// to disk, so there is no body-size limit to configure for uploads.
const nextConfig: NextConfig = {};

export default nextConfig;
