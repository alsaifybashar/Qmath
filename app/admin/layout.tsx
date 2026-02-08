import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/admin');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { role: true },
    });

    if (!user || user.role !== 'admin') {
        redirect('/');
    }

    return <>{children}</>;
}
