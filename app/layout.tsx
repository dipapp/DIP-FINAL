import './globals.css'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
