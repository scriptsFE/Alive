import { useBotStatus } from "@/hooks/use-bot";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Bot, Wifi, WifiOff, Loader2, TerminalSquare } from "lucide-react";
import { format } from "date-fns";

export default function SettingsPage() {
  const { data: status, isLoading } = useBotStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your Discord bot connection and system health.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bot Status Card */}
        <Card className="bg-card border-white/5 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
          
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Bot className="w-6 h-6 text-primary" /> Discord Bot
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Real-time connection status of your generator bot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-5 rounded-xl bg-black/20 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-5 relative z-10">
                {isLoading ? (
                   <div className="p-3 rounded-full bg-white/5 text-muted-foreground">
                     <Loader2 className="w-6 h-6 animate-spin" />
                   </div>
                ) : status?.online ? (
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Wifi className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    <WifiOff className="w-6 h-6" />
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-foreground text-lg">
                    {isLoading ? "Checking..." : status?.online ? "Online & Ready" : "Offline"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isLoading 
                      ? "Connecting to gateway..." 
                      : status?.online 
                        ? `Logged in as ${status.username || 'Bot'}` 
                        : "Bot process is not running."}
                  </p>
                </div>
              </div>

              {/* Pulsing indicator */}
              {!isLoading && status?.online && (
                <div className="relative flex h-4 w-4 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card className="bg-card border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <TerminalSquare className="w-6 h-6 text-muted-foreground" /> Dashboard Info
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current environment and application details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium font-mono text-sm bg-white/5 px-2 py-1 rounded">v1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-medium text-primary">Production</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{format(new Date(), "HH:mm z")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
