import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/components/Providers'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'INDIEGEN — AI Game Asset Studio on Solana',
  description:
    'Generate production-ready 2D sprites, animations, tilesets, parallax backgrounds and 3D models in minutes. Export to Unity, Godot & Unreal. Powered by $INDIEGEN on Solana.',
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'INDIEGEN — AI Game Asset Studio',
    description:
      'Production-ready 2D & 3D game assets, generated in under 60 seconds.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
