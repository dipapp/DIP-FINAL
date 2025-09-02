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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-app py-8">{children}</main>
      </body>
    </html>
  )
}
