import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * Minimal layout for full-screen views (exam viewer).
 * No sidebar, no background — just the content rendered edge-to-edge.
 */
export default async function ExamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    return <>{children}</>;
}
