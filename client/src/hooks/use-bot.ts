import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useBotStatus() {
  return useQuery({
    queryKey: [api.bot.status.path],
    queryFn: async () => {
      const res = await fetch(api.bot.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bot status");
      return api.bot.status.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Poll every 10 seconds for real-time dashboard feel
  });
}
