import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StudyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {children}
        </div>
    );
}
