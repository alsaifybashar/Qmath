import { getReviewNotifications } from '@/app/actions/notification-engine';
import { NotificationsPage } from '@/components/dashboard/ReviewNotifications';

export const metadata = {
    title: 'Review Schedule | Qmath',
    description: 'Spaced repetition review schedule — know exactly what to study and when.',
};

export default async function NotificationsRoute() {
    const summary = await getReviewNotifications();

    return <NotificationsPage summary={summary} />;
}
