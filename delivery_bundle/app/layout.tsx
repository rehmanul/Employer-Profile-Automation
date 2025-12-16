import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Employer Profile Automation | AI-Powered Professional Profiles',
  description: 'Système professionnel d\'automatisation de profils employeur avec extraction de données IA, traitement en temps réel et analyse intelligente. Créez des profils d\'entreprise complets en quelques secondes.',
  keywords: 'profils employeur, automatisation, IA, extraction de données, profil entreprise, benefits, recrutement',
  authors: [{ name: 'RecruitingNOW' }],
  openGraph: {
    title: 'Employer Profile Automation',
    description: 'Professional AI-powered employer profile generation system',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e27',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏢</text></svg>" />
      </head>
      <body className="antialiased bg-[#0a0e27] text-white">{children}</body>
    </html>
  )
}
