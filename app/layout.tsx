import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
  icons: {
    icon: [
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/dip-logo.png?v=2', sizes: 'any', type: 'image/png' },
    ],
    shortcut: '/dip-logo.png?v=2',
    apple: '/dip-logo.png?v=2',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" href="/dip-logo.png?v=2" />
        <link rel="shortcut icon" href="/dip-logo.png?v=2" />
        <link rel="apple-touch-icon" href="/dip-logo.png?v=2" />
      </head>
      <body>
        <Navbar />
        <main className="container-app py-4">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
          <div className="container-app">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                DIP is a membership program, not an insurance company.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
