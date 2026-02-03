import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}