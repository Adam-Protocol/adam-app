import { Navbar } from '@/components/layout/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
        {children}
      </main>
    </div>
  );
}
