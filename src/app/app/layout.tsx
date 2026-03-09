import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page min-h-screen">
      <Navbar />
      <ConnectionStatus />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-24 sm:pb-16">
        {children}
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
