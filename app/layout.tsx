import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
  icons: {
    icon: '/dip-logo.png',
    shortcut: '/dip-logo.png',
    apple: '/dip-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-app py-4">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
          <div className="container-app">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                DIP is a motor club membership program, not insurance. Membership benefits are provided under California Insurance Code §§12140–12164.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
