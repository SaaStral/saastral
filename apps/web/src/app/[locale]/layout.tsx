import type { Metadata } from 'next'
import { Outfit, Sora, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { locales, Locale } from '@/i18n/config'
import '../globals.css'

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

// Generate static routes for each locale
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await params (Next.js 15+ requirement)
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Set locale for this request
  setRequestLocale(locale)

  // Load messages
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${outfit.variable} ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className={outfit.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
