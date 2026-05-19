import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ProfileProvider } from "@/lib/ProfileContext";
import HtmlLang from "@/components/HtmlLang";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: 'AI Resume Analyzer',
    template: '%s | AI Resume Analyzer',
  },
  description: 'วิเคราะห์และประเมินเรซูเม่ด้วย AI สำหรับนักศึกษาและอาจารย์',
  keywords: ['resume', 'AI', 'analyzer', 'เรซูเม่', 'วิเคราะห์', 'สมัครงาน'],
  authors: [{ name: 'AI Resume Analyzer' }],
  openGraph: {
    title: 'AI Resume Analyzer',
    description: 'วิเคราะห์และประเมินเรซูเม่ด้วย AI สำหรับนักศึกษาและอาจารย์',
    type: 'website',
    locale: 'th_TH',
    siteName: 'AI Resume Analyzer',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <ProfileProvider>
            <HtmlLang />
            {children}
          </ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}