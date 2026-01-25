import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-zinc-100 antialiased">
          <div className="flex min-h-screen items-center justify-center">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
