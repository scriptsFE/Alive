import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Plus, Trash2, ShieldAlert, Key, Loader2, ServerCrash } from "lucide-react";
import { useAccounts, useDeleteAccount } from "@/hooks/use-accounts";
import { useToast } from "@/hooks/use-toast";
import { AccountForm } from "@/components/account-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("2026");

  const accountsByYear = {
    "2026": accounts?.filter(a => a.year === 2026) || [],
    "2025": accounts?.filter(a => a.year === 2025) || [],
    "2010": accounts?.filter(a => a.year === 2010) || [],
  };

  const handleDelete = (id: number) => {
    deleteAccount.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Account removed",
          description: "The account has been deleted from the database.",
        });
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Roblox Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the pool of accounts available for generation.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all rounded-xl px-6 h-11"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p>Loading accounts database...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-destructive">
            <ServerCrash className="w-12 h-12 mb-4 opacity-80" />
            <p className="font-medium">Failed to load accounts.</p>
            <p className="text-sm opacity-70 mt-1">Please check your connection.</p>
          </div>
        ) : accounts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">Database is empty</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mb-8">
              There are currently no Roblox accounts loaded. Add accounts to allow the Discord bot to generate them.
            </p>
            <Button onClick={() => setIsAddOpen(true)} variant="outline" className="border-white/10 rounded-xl">
              Add your first account
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-white/5 px-6 flex gap-2">
              {["2026", "2025", "2010"].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedTab(year)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === year
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {year === "2010" ? "Old/2010 Accounts" : `${year} Accounts`}
                </button>
              ))}
            </div>

            {accountsByYear[selectedTab as keyof typeof accountsByYear].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">No {selectedTab} accounts</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  No accounts from {selectedTab} in the database yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground/80 pl-6">Username</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Security</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Added On</TableHead>
                      <TableHead className="text-right pr-6 font-semibold text-foreground/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsByYear[selectedTab as keyof typeof accountsByYear].map((account) => (
                      <TableRow 
                        key={account.id} 
                        className="border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="pl-6 font-medium text-foreground">
                          {account.username}
                        </TableCell>
                        <TableCell>
                          {account.isUsed ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-medium">
                              Already Used
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                              Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Key className="w-4 h-4" />
                            <span className="text-xs">{account.cookie ? "Pass + Cookie" : "Password Only"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(account.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(account.id)}
                            disabled={deleteAccount.isPending && deleteAccount.variables === account.id}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                            title="Delete Account"
                          >
                            {deleteAccount.isPending && deleteAccount.variables === account.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Account Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-white/10 shadow-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Add Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the Roblox credentials. This will be stored securely and made available to the generator bot.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <AccountForm onSuccess={() => setIsAddOpen(false)} defaultYear={selectedTab} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
