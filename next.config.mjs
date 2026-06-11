/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // native module ของ pdfjs/canvas ต้องไม่ถูก bundle (ใช้ตอน PDF→รูปสำหรับ vision)
  serverExternalPackages: ['@napi-rs/canvas', 'unpdf'],
};

export default nextConfig;
