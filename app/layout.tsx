import Providers from '@/components/Providers'
import Header from '@/components/Header'
import './globals.css'
import RealtimeNotifications from '@/components/RealtimeNotifications';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import ReminderListener from '@/components/ReminderListener';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    return (
        <html lang="fr">
        <body>
        <Providers>
            <Header />
            {children}
            {session?.user?.id && <RealtimeNotifications userId={Number(session.user.id)} />}
             <ReminderListener />
        </Providers>
        </body>
        </html>
    )
}
