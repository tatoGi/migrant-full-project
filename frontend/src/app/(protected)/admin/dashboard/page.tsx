"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut, Trash2, Pencil, Search, Save, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { PROFESSIONS, COUNTRIES, CITIES_BY_COUNTRY } from "@/lib/data";
import api from "@/lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "პანელი", path: "/admin/dashboard" },
  { icon: MessageSquare, label: "შეტყობინებები", path: "/admin/messages" },
  { icon: Settings, label: "პარამეტრები", path: "/admin/settings" },
];

interface Listing {
  id: number;
  provider_name: string;
  profession: string;
  country: string;
  city: string;
  price_type: string;
  price_value: number | null;
  description: string | null;
  is_vip: boolean;
  listing_type: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  vip: number;
}

const AdminDashboardPage = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editListing, setEditListing] = useState<Listing | null>(null);

  const { data, isLoading } = useQuery<{ listings: Listing[]; stats: Stats }>({
    queryKey: ["admin-listings", debouncedSearch],
    queryFn: () =>
      api.get("/admin/listings", { params: debouncedSearch ? { search: debouncedSearch } : {} })
        .then((r) => r.data),
  });

  const listings = data?.listings ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, vip: 0 };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("განცხადება წაიშალა.");
    },
    onError: () => toast.error("წაშლა ვერ მოხდა."),
  });

  const updateMutation = useMutation({
    mutationFn: (listing: Listing) =>
      api.put(`/admin/listings/${listing.id}`, {
        provider_name: listing.provider_name,
        profession: listing.profession,
        country: listing.country,
        city: listing.city,
        description: listing.description,
        price_type: listing.price_type,
        price_value: listing.price_value,
        status: listing.status,
        listing_type: listing.is_vip ? "vip" : "standard",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("განცხადება განახლდა.");
      setEditListing(null);
    },
    onError: () => toast.error("შენახვა ვერ მოხდა."),
  });

  const handleDelete = (id: number) => {
    if (!confirm("ნამდვილად გსურთ ამ განცხადების წაშლა?")) return;
    deleteMutation.mutate(id);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
      () => setDebouncedSearch(value),
      400
    );
  };

  const handleLogout = async () => { await signOut(); router.push("/"); };

  const cities = editListing?.country ? CITIES_BY_COUNTRY[editListing.country] ?? [] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
                <LogOut className="h-4 w-4" /> გასვლა
              </button>
            </nav>
          </aside>

          <main className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">ადმინის პანელი</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "სულ განცხადებები", value: stats.total },
                { label: "აქტიური", value: stats.active },
                { label: "VIP", value: stats.vip },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-display text-3xl font-bold text-foreground mt-1">
                    {isLoading ? "—" : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ძიება სახელით, პროფესიით, ქალაქით..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">იტვირთება...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">განცხადებები არ მოიძებნა</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">სახელი</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">პროფესია</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">ქალაქი</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">ფასი</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">სტატუსი</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">თარიღი</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium text-foreground">
                            <div className="flex items-center gap-1.5">
                              {listing.listing_type === "vip" && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">VIP</span>
                              )}
                              {listing.provider_name}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{listing.profession}</td>
                          <td className="p-3 text-muted-foreground">{listing.city}, {listing.country}</td>
                          <td className="p-3 text-muted-foreground">
                            {listing.price_type === "negotiable" ? "შეთანხმებით" : `€${listing.price_value}`}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${listing.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                              {listing.status === "active" ? "აქტიური" : "არააქტიური"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(listing.created_at).toLocaleDateString("ka-GE")}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditListing({ ...listing, is_vip: listing.listing_type === "vip" })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(listing.id)} disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Dialog open={!!editListing} onOpenChange={(open) => !open && setEditListing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>განცხადების რედაქტირება</DialogTitle>
          </DialogHeader>
          {editListing && (
            <div className="space-y-4">
              <div>
                <Label>სახელი</Label>
                <Input value={editListing.provider_name} onChange={(e) => setEditListing({ ...editListing, provider_name: e.target.value })} />
              </div>
              <div>
                <Label>პროფესია</Label>
                <Select value={editListing.profession} onValueChange={(v) => setEditListing({ ...editListing, profession: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ქვეყანა</Label>
                  <Select value={editListing.country} onValueChange={(v) => setEditListing({ ...editListing, country: v, city: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ქალაქი</Label>
                  <Select value={editListing.city} onValueChange={(v) => setEditListing({ ...editListing, city: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>აღწერა</Label>
                <Textarea value={editListing.description ?? ""} onChange={(e) => setEditListing({ ...editListing, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ფასის ტიპი</Label>
                  <Select value={editListing.price_type} onValueChange={(v) => setEditListing({ ...editListing, price_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">ფიქსირებული</SelectItem>
                      <SelectItem value="hourly">საათობრივი</SelectItem>
                      <SelectItem value="negotiable">შეთანხმებით</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editListing.price_type !== "negotiable" && (
                  <div>
                    <Label>ფასი (€)</Label>
                    <Input type="number" value={editListing.price_value ?? ""} onChange={(e) => setEditListing({ ...editListing, price_value: Number(e.target.value) })} />
                  </div>
                )}
              </div>
              <div>
                <Label>სტატუსი</Label>
                <Select value={editListing.status} onValueChange={(v) => setEditListing({ ...editListing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">აქტიური</SelectItem>
                    <SelectItem value="inactive">არააქტიური</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editListing.is_vip} onChange={(e) => setEditListing({ ...editListing, is_vip: e.target.checked })} className="accent-primary" />
                <Label>VIP განცხადება</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)}>გაუქმება</Button>
            <Button onClick={() => editListing && updateMutation.mutate(editListing)} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> {updateMutation.isPending ? "ინახება…" : "შენახვა"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
