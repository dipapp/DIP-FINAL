import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#87ceeb" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container-app py-4 sm:py-6 lg:py-8">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-8 sm:mt-12">
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
