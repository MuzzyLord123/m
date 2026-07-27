import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FolderTree, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

interface Category {
  id: string; name: string; slug: string; description: string | null; image_url: string | null;
}

export default function CollectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Category>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [c, p] = await Promise.all([
      supabase.from('product_categories').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('products').select('category_id').eq('user_id', user.id),
    ]);
    setCats((c.data as any) || []);
    const map: Record<string, number> = {};
    (p.data || []).forEach((row: any) => {
      if (row.category_id) map[row.category_id] = (map[row.category_id] || 0) + 1;
    });
    setCounts(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const openNew  = () => { setEditing({ name: '', slug: '', description: '' }); setOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setOpen(true); };

  async function save() {
    if (!editing.name?.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    const slug = (editing.slug || editing.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = { user_id: user!.id, name: editing.name!.trim(), slug, description: editing.description || null };
    const { error } = editing.id
      ? await supabase.from('product_categories').update(payload).eq('id', editing.id)
      : await supabase.from('product_categories').insert(payload as any);
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing.id ? 'Collection updated' : 'Collection added' });
    setOpen(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this collection?')) return;
    await supabase.from('product_categories').delete().eq('id', id);
    toast({ title: 'Collection deleted' });
    load();
  }

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Collections']}
        title="Collections"
        description="Group products together so customers can browse a specific set on your storefront."
        actions={
          <Button size="sm" className="h-8 rounded-lg text-xs bg-foreground text-background hover:bg-foreground/90" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create collection
          </Button>
        }
      />
      <PageBody>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-xl border border-border/50 bg-background animate-pulse" />)}
          </div>
        ) : cats.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No collections yet"
            description="Collections keep related products together — for example a seasonal drop, a category, or a curated bundle."
            primaryAction={{ label: 'Create your first collection', onClick: openNew }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cats.map(c => (
              <div key={c.id} className="group rounded-xl border border-border/50 bg-background p-4 hover:border-border transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold tracking-tight truncate">{c.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">/{c.slug}</p>
                    {c.description && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{c.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => openEdit(c)} className="text-xs"><Edit className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => del(c.id)} className="text-xs text-red-500"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground tabular-nums">
                  {counts[c.id] || 0} {(counts[c.id] || 0) === 1 ? 'product' : 'products'}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit collection' : 'New collection'}</DialogTitle>
            <DialogDescription>Collections group products together on your storefront.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="cname" className="text-xs">Name</Label>
              <Input id="cname" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Summer collection" />
            </div>
            <div>
              <Label htmlFor="cslug" className="text-xs">Slug</Label>
              <Input id="cslug" value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="summer-collection" />
            </div>
            <div>
              <Label htmlFor="cdesc" className="text-xs">Description</Label>
              <Textarea id="cdesc" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save collection'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
