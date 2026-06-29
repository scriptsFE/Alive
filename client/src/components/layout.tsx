import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  // Configured with custom CSS properties to set sidebar width
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30 relative">
        {/* Subtle premium background glow */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        <AppSidebar />
        
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="flex items-center h-16 px-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 w-full">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
