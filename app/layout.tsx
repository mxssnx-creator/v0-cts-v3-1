export const metadata = {
  title: 'Automated Trading System',
  description: 'Professional crypto trading system',
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}


import './globals.css'