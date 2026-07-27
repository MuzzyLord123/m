import { useState } from 'react';
import { Plus, Trash2, Loader2, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmins, adminColor } from '@/pages/lounge/crm/useAdmins';

export default function ManageAdminsPanel() {
  const { toast } = useToast();
  const { admins, loading, refresh } = useAdmins();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  async function createAdmin() {
    if (!form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Email and password required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('create-admin-account', {
      body: { action: 'create', ...form },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to create admin', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Admin created', description: `${form.email} now has admin access.` });
    setForm({ email: '', password: '', fullName: '' });
    setOpen(false);
    refresh();
  }

  async function revoke(userId: string, label: string) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('create-admin-account', {
      body: { action: 'revoke', userId },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to revoke', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Admin revoked', description: `${label} no longer has admin access.` });
    refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Admin Accounts</h2>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create admin account</DialogTitle>
              <DialogDescription>Grants Quooro Team and full CRM access to the new user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
              </div>
              <div>
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={createAdmin} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Any admin can create or revoke other admin accounts. Owners are permanent and can't be revoked.
      </p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <ul className="rounded-xl border border-border divide-y divide-border bg-card">
          {admins.map(a => (
            <li key={a.user_id} className="flex items-center gap-3 p-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ backgroundColor: adminColor(a.user_id) }}>
                {a.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  {a.full_name || a.email}
                  {a.is_owner && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
              </div>
              {a.is_owner ? (
                <span className="text-[10px] text-amber-400 uppercase font-medium tracking-wide">Owner</span>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {a.full_name || a.email} will no longer have access to Quooro Team or the CRM. Their account is not deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revoke(a.user_id, a.full_name || a.email || 'User')} disabled={busy}>
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
