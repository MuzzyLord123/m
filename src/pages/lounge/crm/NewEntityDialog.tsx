import { useMemo, useState } from 'react';
import { Loader2, Search, Building2, User, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { EntityType, CRMCompany, CRMContact } from './useCRMData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: EntityType;
  companies: CRMCompany[];
  contacts: CRMContact[];
  orgId: string | null;
  onCreated: () => void;
}

export function NewEntityDialog({ open, onOpenChange, entityType, companies, contacts, orgId, onCreated }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedContact, setLinkedContact] = useState<CRMContact | null>(null);
  const [linkedCompany, setLinkedCompany] = useState<CRMCompany | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function reset() {
    setTitle(''); setValue(''); setNotes(''); setLinkedContact(null); setLinkedCompany(null); setEmail(''); setPhone('');
  }

  async function submit() {
    if (!orgId) { toast({ title: 'No organisation context', variant: 'destructive' }); return; }
    if (!title.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);

    let error: any = null;
    if (entityType === 'opportunity') {
      const res = await supabase.from('crm_opportunities').insert({
        org_id: orgId,
        owner_id: user?.id ?? null,
        title: title.trim(),
        value: value ? Number(value) : null,
        currency: 'GBP',
        description: notes || null,
        contact_id: linkedContact?.id ?? null,
        company_id: linkedCompany?.id ?? linkedContact?.company_id ?? null,
      } as any);
      error = res.error;
    } else if (entityType === 'contact') {
      const res = await supabase.from('crm_contacts').insert({
        org_id: orgId,
        owner_id: user?.id ?? null,
        full_name: title.trim(),
        email: email || null,
        phone: phone || null,
        company_id: linkedCompany?.id ?? null,
        relationship_type: ['lead'],
      } as any);
      error = res.error;
    } else {
      const res = await supabase.from('crm_companies').insert({
        org_id: orgId,
        owner_id: user?.id ?? null,
        name: title.trim(),
        email: email || null,
        phone: phone || null,
        relationship_type: ['lead'],
      } as any);
      error = res.error;
    }

    setSaving(false);
    if (error) { toast({ title: 'Create failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Created' });
    reset();
    onOpenChange(false);
    onCreated();
  }

  const label = entityType === 'opportunity' ? 'Opportunity' : entityType === 'contact' ? 'Contact' : 'Company';

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New {label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">{entityType === 'opportunity' ? 'Title' : 'Name'} *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={entityType === 'opportunity' ? 'e.g. Website redesign' : 'e.g. Acme Ltd'} />
          </div>

          {entityType === 'opportunity' && (
            <>
              <div>
                <Label className="text-xs">Value (GBP)</Label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Assign to lead / contact</Label>
                <LeadSearch
                  contacts={contacts}
                  companies={companies}
                  selectedContact={linkedContact}
                  selectedCompany={linkedCompany}
                  onPickContact={(c) => { setLinkedContact(c); if (c?.company_id) setLinkedCompany(companies.find(co => co.id === c.company_id) || null); }}
                  onPickCompany={(c) => setLinkedCompany(c)}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional description" />
              </div>
            </>
          )}

          {entityType !== 'opportunity' && (
            <>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              {entityType === 'contact' && (
                <div>
                  <Label className="text-xs">Company (optional)</Label>
                  <LeadSearch
                    contacts={[]}
                    companies={companies}
                    selectedContact={null}
                    selectedCompany={linkedCompany}
                    onPickContact={() => {}}
                    onPickCompany={setLinkedCompany}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Create {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadSearch({
  contacts, companies, selectedContact, selectedCompany, onPickContact, onPickCompany,
}: {
  contacts: CRMContact[]; companies: CRMCompany[];
  selectedContact: CRMContact | null; selectedCompany: CRMCompany | null;
  onPickContact: (c: CRMContact | null) => void; onPickCompany: (c: CRMCompany | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filteredContacts = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return contacts.slice(0, 40);
    return contacts.filter(c =>
      (c.full_name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s)
    ).slice(0, 40);
  }, [contacts, q]);

  const filteredCompanies = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return companies.slice(0, 40);
    return companies.filter(c => (c.name || '').toLowerCase().includes(s)).slice(0, 40);
  }, [companies, q]);

  const label =
    selectedContact ? (selectedContact.full_name || selectedContact.email || 'Contact') :
    selectedCompany ? selectedCompany.name :
    'Search contacts & companies…';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-left flex items-center gap-2 hover:bg-accent transition-colors">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className={`truncate ${selectedContact || selectedCompany ? '' : 'text-muted-foreground'}`}>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email…" className="h-8 text-sm" />
        </div>
        <ScrollArea className="max-h-72">
          {contacts.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Contacts</div>
              {filteredContacts.map(c => {
                const active = selectedContact?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { onPickContact(active ? null : c); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left ${active ? 'bg-accent/60' : ''}`}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unnamed'}</span>
                    {c.email && <span className="text-[10px] text-muted-foreground truncate">{c.email}</span>}
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
              {filteredContacts.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No matches</div>}
            </div>
          )}
          <div className="py-1 border-t border-border">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Companies</div>
            {filteredCompanies.map(c => {
              const active = selectedCompany?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { onPickCompany(active ? null : c); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left ${active ? 'bg-accent/60' : ''}`}
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{c.name}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            {filteredCompanies.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No matches</div>}
          </div>
        </ScrollArea>
        {(selectedContact || selectedCompany) && (
          <div className="p-2 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => { onPickContact(null); onPickCompany(null); }}>Clear selection</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
