import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: 'GroomAI — AI Skincare & Dermatological Routine Advisor',
  description: 'Clinical-grade skincare routines, formulation ingredient analysis, and context-aware dermatological recommendations powered by OpenAI Agents & FAISS vector search.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#4C7359]/20 selection:text-[#3E6049]">
        {children}
      </body>
    </html>
  );
}