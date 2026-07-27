import { useState } from 'react';
import { useStorefront } from '@/contexts/StorefrontContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Lock, Phone } from 'lucide-react';

export function StorefrontAuth() {
  const { authOpen, setAuthOpen, login, signup } = useStorefront();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.email, form.password, form.name, form.phone);
      }
      toast({ title: mode === 'login' ? 'Welcome back!' : 'Account created!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign In' : 'Create Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="sf-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="sf-name" placeholder="John Doe" className="pl-10" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="sf-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="sf-email" type="email" placeholder="you@example.com" className="pl-10" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="sf-password" type="password" placeholder="••••••••" className="pl-10" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="sf-phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="sf-phone" type="tel" placeholder="+44..." className="pl-10" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" className="text-primary underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
