import Providers from '@/components/Providers'
import Header from '@/components/Header'
import './globals.css'
import 'leaflet/dist/leaflet.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
        <body>
        <Providers>
            <Header />
            {children}
        </Providers>
        </body>
        </html>
    )
}
