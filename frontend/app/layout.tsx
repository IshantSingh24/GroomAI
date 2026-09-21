import './globals.css'

export const metadata = {
  title: 'GroomAI — Your Personal Style Advisor',
  description: 'AI-powered grooming, skincare & style recommendations tailored to you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  )
}