import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'LTVStudio™ - Nền Tảng Cấp Phép & Xác Thực Bản Quyền',
  description: 'Hệ thống xác thực mã bản quyền thiết bị HWID, cập nhật OTA phần mềm và phân quyền quản trị RBAC cho LTVStudio.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2306b6d4'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>",
  },
  openGraph: {
    title: 'LTVStudio™ License Hub',
    description: 'Hệ thống cấp phép bản quyền và xác thực thiết bị HWID bảo mật cao.',
    url: 'https://ltv-tools.vercel.app',
    siteName: 'LTVStudio Ecosystem',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="cyber-bg-glow min-h-screen text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
