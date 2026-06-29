import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type InsertAccount } from "@shared/schema";
import { useCreateAccount } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountFormProps {
  onSuccess?: () => void;
  defaultYear?: string;
}

export function AccountForm({ onSuccess, defaultYear = "2026" }: AccountFormProps) {
  const { toast } = useToast();
  const createAccount = useCreateAccount();

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      username: "",
      password: "",
      cookie: "",
      year: parseInt(defaultYear),
    },
  });

  function onSubmit(data: InsertAccount) {
    createAccount.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Account Added",
          description: "The Roblox account has been successfully saved.",
        });
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Failed to add account",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Roblox username" 
                  className="bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cookie"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Cookie <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder=".ROBLOSECURITY token" 
                  className="bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground/70">
                Optional: Include the security cookie for direct login bypassing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Account Year</FormLabel>
              <Select value={String(field.value)} onValueChange={(val) => field.onChange(parseInt(val))}>
                <FormControl>
                  <SelectTrigger className="bg-black/20 border-white/10 focus-visible:ring-primary/50">
                    <SelectValue placeholder="Select account year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2010">2010</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createAccount.isPending}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/20 transition-all"
        >
          {createAccount.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Account...
            </>
          ) : (
            "Add Account to Database"
          )}
        </Button>
      </form>
    </Form>
  );
}
