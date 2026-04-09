import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono'
})

export const metadata: Metadata = {
  title: 'GuardAI - AI-Powered Scam & Fraud Detection',
  description: 'Advanced AI-powered scam and fraud detection system for Malaysia. Detect Macau scams, phishing attempts, and fraudulent messages instantly.',
  generator: 'v0.app',
  keywords: ['scam detection', 'fraud detection', 'Malaysia', 'AI', 'cybersecurity', 'Macau scam', 'phishing'],
  authors: [{ name: 'GuardAI Team' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#07090f',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
        <div className="scanline-overlay" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
