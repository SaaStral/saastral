import type { Metadata } from 'next'
import { Outfit, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SaaStral - Open Source SaaS Management Platform',
  description: 'Control SaaS spending, detect unused licenses, and optimize your software stack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className={outfit.className}>{children}</body>
    </html>
  )
}
