import { AppNav } from "@/components/app-nav";
import { ToastProvider } from "@/components/toaster";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const reorderCount = await prisma.reorderEntry.count({ where: { checked: false } });

  return (
    <ToastProvider>
      <AppNav reorderCount={reorderCount} />
      <div className="mx-auto w-full max-w-content flex-1 px-4 pb-24 pt-6 md:px-6 desk:pb-12">{children}</div>
    </ToastProvider>
  );
}
