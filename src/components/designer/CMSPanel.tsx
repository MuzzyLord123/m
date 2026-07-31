import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Database, FileText, Trash2, Edit2, ChevronRight, ChevronLeft, Eye, EyeOff, GripVertical, Search, Copy, Calendar, Filter, CheckSquare, Square, LayoutTemplate } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CMSField {
  name: string;
  slug: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'image' | 'date' | 'url' | 'color' | 'select' | 'reference' | 'email' | 'file' | 'json' | 'markdown' | 'gallery';
  required?: boolean;
  options?: string[];
  helpText?: string;
  defaultValue?: any;
  validation?: { min?: number; max?: number; pattern?: string };
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: CMSField[];
  icon: string;
}

interface Entry {
  id: string;
  title: string;
  slug: string;
  status: string;
  data: Record<string, any>;
  published_at: string | null;
  created_at: string;
}

const FIELD_TYPES: { value: CMSField['type']; label: string; icon: string }[] = [
  { value: 'text', label: 'Plain Text', icon: '📝' },
  { value: 'richtext', label: 'Rich Text', icon: '📄' },
  { value: 'markdown', label: 'Markdown', icon: '📋' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Yes/No', icon: '✅' },
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'gallery', label: 'Gallery', icon: '🎨' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'color', label: 'Color', icon: '🎨' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'reference', label: 'Reference', icon: '🔗' },
  { value: 'file', label: 'File', icon: '📁' },
  { value: 'json', label: 'JSON', icon: '{ }' },
];

const COLLECTION_PRESETS = [
  { name: 'Blog Posts', slug: 'blog-posts', icon: '📝', fields: [
    { name: 'Content', slug: 'content', type: 'richtext' as const },
    { name: 'Featured Image', slug: 'featured_image', type: 'image' as const },
    { name: 'Author', slug: 'author', type: 'text' as const },
    { name: 'Category', slug: 'category', type: 'select' as const, options: ['Technology', 'Business', 'Design', 'Marketing'] },
    { name: 'Tags', slug: 'tags', type: 'text' as const },
    { name: 'Excerpt', slug: 'excerpt', type: 'text' as const },
    { name: 'Published Date', slug: 'publish_date', type: 'date' as const },
    { name: 'Read Time', slug: 'read_time', type: 'number' as const },
  ]},
  { name: 'Team Members', slug: 'team-members', icon: '👥', fields: [
    { name: 'Photo', slug: 'photo', type: 'image' as const },
    { name: 'Role', slug: 'role', type: 'text' as const },
    { name: 'Bio', slug: 'bio', type: 'richtext' as const },
    { name: 'Email', slug: 'email', type: 'email' as const },
    { name: 'LinkedIn', slug: 'linkedin', type: 'url' as const },
    { name: 'Twitter', slug: 'twitter', type: 'url' as const },
    { name: 'Department', slug: 'department', type: 'select' as const, options: ['Engineering', 'Design', 'Marketing', 'Sales', 'Operations'] },
  ]},
  { name: 'Case Studies', slug: 'case-studies', icon: '📊', fields: [
    { name: 'Client', slug: 'client', type: 'text' as const },
    { name: 'Cover Image', slug: 'cover_image', type: 'image' as const },
    { name: 'Challenge', slug: 'challenge', type: 'richtext' as const },
    { name: 'Solution', slug: 'solution', type: 'richtext' as const },
    { name: 'Results', slug: 'results', type: 'richtext' as const },
    { name: 'Testimonial', slug: 'testimonial', type: 'text' as const },
    { name: 'Industry', slug: 'industry', type: 'select' as const, options: ['Tech', 'Healthcare', 'Finance', 'Retail', 'Education'] },
    { name: 'Gallery', slug: 'gallery', type: 'gallery' as const },
  ]},
  { name: 'FAQs', slug: 'faqs', icon: '❓', fields: [
    { name: 'Question', slug: 'question', type: 'text' as const },
    { name: 'Answer', slug: 'answer', type: 'richtext' as const },
    { name: 'Category', slug: 'category', type: 'select' as const, options: ['General', 'Billing', 'Technical', 'Account'] },
  ]},
  { name: 'Testimonials', slug: 'testimonials', icon: '⭐', fields: [
    { name: 'Quote', slug: 'quote', type: 'richtext' as const },
    { name: 'Author Name', slug: 'author_name', type: 'text' as const },
    { name: 'Author Role', slug: 'author_role', type: 'text' as const },
    { name: 'Author Photo', slug: 'author_photo', type: 'image' as const },
    { name: 'Company', slug: 'company', type: 'text' as const },
    { name: 'Rating', slug: 'rating', type: 'number' as const },
  ]},
  { name: 'Portfolio', slug: 'portfolio', icon: '🎨', fields: [
    { name: 'Description', slug: 'description', type: 'richtext' as const },
    { name: 'Cover Image', slug: 'cover_image', type: 'image' as const },
    { name: 'Gallery', slug: 'gallery', type: 'gallery' as const },
    { name: 'Client', slug: 'client', type: 'text' as const },
    { name: 'Category', slug: 'category', type: 'select' as const, options: ['Web Design', 'Branding', 'Photography', 'Video'] },
    { name: 'Project URL', slug: 'project_url', type: 'url' as const },
    { name: 'Year', slug: 'year', type: 'number' as const },
  ]},
  { name: 'Events', slug: 'events', icon: '📅', fields: [
    { name: 'Description', slug: 'description', type: 'richtext' as const },
    { name: 'Event Date', slug: 'event_date', type: 'date' as const },
    { name: 'Location', slug: 'location', type: 'text' as const },
    { name: 'Cover Image', slug: 'cover_image', type: 'image' as const },
    { name: 'Registration URL', slug: 'registration_url', type: 'url' as const },
    { name: 'Price', slug: 'price', type: 'number' as const },
    { name: 'Capacity', slug: 'capacity', type: 'number' as const },
  ]},
  { name: 'Services', slug: 'services', icon: '⚙️', fields: [
    { name: 'Description', slug: 'description', type: 'richtext' as const },
    { name: 'Icon', slug: 'icon', type: 'image' as const },
    { name: 'Price', slug: 'price', type: 'text' as const },
    { name: 'Features', slug: 'features', type: 'richtext' as const },
    { name: 'CTA Text', slug: 'cta_text', type: 'text' as const },
    { name: 'CTA URL', slug: 'cta_url', type: 'url' as const },
  ]},
];

export function CMSPanel({ siteId }: { siteId?: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState<Entry | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [newFields, setNewFields] = useState<CMSField[]>([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryData, setNewEntryData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showSchedule, setShowSchedule] = useState<Entry | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  const loadCollections = useCallback(async () => {
    if (!siteId) return;
    const { data } = await supabase.from('cms_collections').select('*').eq('site_id', siteId).order('sort_order');
    if (data) setCollections(data.map((d: any) => ({ ...d, fields: (Array.isArray(d.fields) ? d.fields : []) as CMSField[] })));
    setLoading(false);
  }, [siteId]);

  const loadEntries = useCallback(async (collectionId: string) => {
    const { data } = await supabase.from('cms_entries').select('*').eq('collection_id', collectionId).order('created_at', { ascending: false });
    if (data) setEntries(data as Entry[]);
  }, []);

  useEffect(() => { loadCollections(); }, [loadCollections]);
  useEffect(() => { if (activeCollection) loadEntries(activeCollection.id); }, [activeCollection, loadEntries]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery) result = result.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'all') result = result.filter(e => e.status === statusFilter);
    return result;
  }, [entries, searchQuery, statusFilter]);

  const createCollection = async () => {
    if (!siteId || !newCollName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const slug = newCollName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase.from('cms_collections').insert({
      site_id: siteId, user_id: user.id, name: newCollName.trim(), slug,
      description: newCollDesc || null, fields: newFields as any,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCollections(prev => [...prev, { ...data, fields: (data.fields as any) || [] } as Collection]);
    setShowNewCollection(false); setNewCollName(''); setNewCollDesc(''); setNewFields([]);
    toast({ title: 'Collection created' });
  };

  const createFromPreset = async (preset: typeof COLLECTION_PRESETS[0]) => {
    if (!siteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('cms_collections').insert({
      site_id: siteId, user_id: user.id, name: preset.name, slug: preset.slug,
      description: null, fields: preset.fields as any, icon: preset.icon,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCollections(prev => [...prev, { ...data, fields: (data.fields as any) || [] } as Collection]);
    toast({ title: `${preset.name} collection created` });
    setShowPresets(false);
  };

  const deleteCollection = async (id: string) => {
    await supabase.from('cms_entries').delete().eq('collection_id', id);
    await supabase.from('cms_collections').delete().eq('id', id);
    setCollections(prev => prev.filter(c => c.id !== id));
    if (activeCollection?.id === id) { setActiveCollection(null); setEntries([]); }
    toast({ title: 'Collection deleted' });
  };

  const createEntry = async () => {
    if (!activeCollection || !siteId || !newEntryTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const slug = newEntryTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase.from('cms_entries').insert({
      collection_id: activeCollection.id, site_id: siteId, user_id: user.id,
      title: newEntryTitle.trim(), slug, data: newEntryData as any,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setEntries(prev => [data as Entry, ...prev]);
    setShowNewEntry(false); setNewEntryTitle(''); setNewEntryData({});
    toast({ title: 'Entry created' });
  };

  const updateEntry = async (entry: Entry, updates: Partial<Entry>) => {
    const { error } = await supabase.from('cms_entries').update(updates as any).eq('id', entry.id);
    if (!error) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updates } : e));
      if (showEditEntry?.id === entry.id) setShowEditEntry({ ...showEditEntry, ...updates } as Entry);
    }
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('cms_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Entry deleted' });
  };

  const togglePublish = async (entry: Entry) => {
    const newStatus = entry.status === 'published' ? 'draft' : 'published';
    await updateEntry(entry, { status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null } as any);
    toast({ title: newStatus === 'published' ? 'Published' : 'Unpublished' });
  };

  const bulkPublish = async () => {
    for (const id of selectedEntries) {
      const entry = entries.find(e => e.id === id);
      if (entry && entry.status !== 'published') await updateEntry(entry, { status: 'published', published_at: new Date().toISOString() } as any);
    }
    setSelectedEntries(new Set());
    toast({ title: `${selectedEntries.size} entries published` });
  };

  const bulkDelete = async () => {
    for (const id of selectedEntries) await deleteEntry(id);
    setSelectedEntries(new Set());
  };

  const duplicateEntry = async (entry: Entry) => {
    if (!activeCollection || !siteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('cms_entries').insert({
      collection_id: activeCollection.id, site_id: siteId, user_id: user.id,
      title: `${entry.title} (Copy)`, slug: `${entry.slug}-copy-${Date.now()}`,
      data: entry.data as any, status: 'draft',
    }).select().single();
    if (!error && data) { setEntries(prev => [data as Entry, ...prev]); toast({ title: 'Entry duplicated' }); }
  };

  const schedulePublish = async () => {
    if (!showSchedule || !scheduleDate) return;
    await updateEntry(showSchedule, { status: 'scheduled', published_at: new Date(scheduleDate).toISOString() } as any);
    setShowSchedule(null); setScheduleDate('');
    toast({ title: 'Publication scheduled' });
  };

  const updateCollectionFields = async (fields: CMSField[]) => {
    if (!activeCollection) return;
    const { error } = await supabase.from('cms_collections').update({ fields: fields as any }).eq('id', activeCollection.id);
    if (!error) {
      setActiveCollection({ ...activeCollection, fields });
      setCollections(prev => prev.map(c => c.id === activeCollection.id ? { ...c, fields } : c));
      toast({ title: 'Fields updated' });
    }
  };

  const addField = () => setNewFields(prev => [...prev, { name: '', slug: '', type: 'text' }]);
  const updateField = (idx: number, updates: Partial<CMSField>) => {
    setNewFields(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...updates };
      if (updates.name && !updates.slug) updated.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      return updated;
    }));
  };

  const renderFieldInput = (field: CMSField, value: any, onChange: (val: any) => void, isEdit = false) => {
    const inputStyle = { backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' };
    switch (field.type) {
      case 'richtext': case 'markdown':
        return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} className="text-[12px]" style={inputStyle} placeholder={field.helpText} />;
      case 'number':
        return <Input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} className="h-8 text-[12px]" style={inputStyle} />;
      case 'boolean':
        return <label className="flex items-center gap-2"><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} /><span className="text-[11px]">{field.name}</span></label>;
      case 'date':
        return <Input type="datetime-local" value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-[12px]" style={inputStyle} />;
      case 'color':
        return <div className="flex gap-2"><Input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="h-8 w-12 p-0.5" style={inputStyle} /><Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-[12px] flex-1" style={inputStyle} /></div>;
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-[12px]" style={inputStyle}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{(field.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      case 'email':
        return <Input type="email" value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-[12px]" style={inputStyle} placeholder="email@example.com" />;
      case 'gallery':
        return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} className="text-[12px]" style={inputStyle} placeholder="One image URL per line" />;
      case 'json':
        return <Textarea value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)} onChange={e => onChange(e.target.value)} rows={4} className="text-[12px] font-mono" style={inputStyle} placeholder='{"key": "value"}' />;
      default:
        return <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-[12px]" style={inputStyle} placeholder={field.helpText} />;
    }
  };

  if (!siteId) return <div className="flex items-center justify-center h-full text-[11px] text-[#555]">No site loaded</div>;

  // Collection list view
  if (!activeCollection) {
    return (
      <div className="h-full flex flex-col" style={{ color: '#ccc' }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888]">CMS</span>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowPresets(true)}>
              <LayoutTemplate className="h-3 w-3 mr-1" /> Templates
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowNewCollection(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 text-[11px] text-[#555]">Loading</div>
          ) : collections.length === 0 ? (
            <div className="p-4 text-center">
              <Database className="h-8 w-8 mx-auto text-[#444] mb-2" />
              <p className="text-[11px] text-[#666] mb-2">No CMS collections yet</p>
              <p className="text-[10px] text-[#555] mb-3">Start with a template or create a custom collection</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" className="h-7 text-[11px]" onClick={() => setShowPresets(true)}>
                  <LayoutTemplate className="h-3 w-3 mr-1" /> Templates
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowNewCollection(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Custom
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {collections.map(coll => (
                <div key={coll.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 group" onClick={() => setActiveCollection(coll)}>
                  <span className="text-sm shrink-0">{coll.icon || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{coll.name}</p>
                    <p className="text-[10px] text-[#555]">{coll.fields.length} fields</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-[#555]" />
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400" onClick={e => { e.stopPropagation(); deleteCollection(coll.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Preset Templates Dialog */}
        <Dialog open={showPresets} onOpenChange={setShowPresets}>
          <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
            <DialogHeader><DialogTitle className="text-sm">Collection Templates</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="grid grid-cols-2 gap-2 p-1">
                {COLLECTION_PRESETS.map(preset => (
                  <button key={preset.slug} onClick={() => createFromPreset(preset)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/5 text-center transition-colors" style={{ border: '1px solid #333' }}>
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-[11px] font-medium">{preset.name}</span>
                    <span className="text-[9px] text-[#666]">{preset.fields.length} fields</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* New Collection Dialog */}
        <Dialog open={showNewCollection} onOpenChange={setShowNewCollection}>
          <DialogContent className="sm:max-w-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
            <DialogHeader><DialogTitle className="text-sm">Create Custom Collection</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#888] mb-1 block">Collection Name</label>
                <Input value={newCollName} onChange={e => setNewCollName(e.target.value)} placeholder="e.g. Blog Posts" className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
              </div>
              <div>
                <label className="text-[11px] text-[#888] mb-1 block">Description</label>
                <Input value={newCollDesc} onChange={e => setNewCollDesc(e.target.value)} placeholder="Optional" className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-[#888]">Fields</label>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={addField}><Plus className="h-3 w-3 mr-1" /> Add Field</Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="flex-1 space-y-1.5">
                        <Input value={field.name} onChange={e => updateField(idx, { name: e.target.value })} placeholder="Field name" className="h-7 text-[11px]" style={{ backgroundColor: '#222', border: '1px solid #3a3a3a', color: '#ccc' }} />
                        <div className="flex gap-2">
                          <Select value={field.type} onValueChange={v => updateField(idx, { type: v as CMSField['type'] })}>
                            <SelectTrigger className="h-7 text-[11px] flex-1" style={{ backgroundColor: '#222', border: '1px solid #3a3a3a', color: '#ccc' }}><SelectValue /></SelectTrigger>
                            <SelectContent>{FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.icon} {ft.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <label className="flex items-center gap-1 text-[10px] text-[#888]">
                            <input type="checkbox" checked={field.required || false} onChange={e => updateField(idx, { required: e.target.checked })} />Req
                          </label>
                        </div>
                        {field.type === 'select' && (
                          <Input value={(field.options || []).join(', ')} onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="option1, option2, option3" className="h-7 text-[10px]" style={{ backgroundColor: '#222', border: '1px solid #3a3a3a', color: '#ccc' }} />
                        )}
                        <Input value={field.helpText || ''} onChange={e => updateField(idx, { helpText: e.target.value })} placeholder="Help text (optional)" className="h-6 text-[10px]" style={{ backgroundColor: '#222', border: '1px solid #3a3a3a', color: '#888' }} />
                      </div>
                      <button onClick={() => setNewFields(prev => prev.filter((_, i) => i !== idx))} className="text-[#666] hover:text-red-400 mt-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button size="sm" onClick={createCollection} disabled={!newCollName.trim()}>Create Collection</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Entry list view
  return (
    <div className="h-full flex flex-col" style={{ color: '#ccc' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={() => { setActiveCollection(null); setEntries([]); setSearchQuery(''); setStatusFilter('all'); setSelectedEntries(new Set()); }} className="text-[#888] hover:text-white">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm shrink-0">{activeCollection.icon || '📄'}</span>
        <span className="text-[11px] font-semibold flex-1 truncate">{activeCollection.name}</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowFieldEditor(true)}>
          <Edit2 className="h-3 w-3 mr-1" /> Fields
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setNewEntryData({}); setNewEntryTitle(''); setShowNewEntry(true); }}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search & filter bar */}
      <div className="flex gap-1.5 px-2 py-1.5" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#555]" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="h-7 text-[11px] pl-7" style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#ccc' }} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 w-24 text-[10px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#ccc' }}><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedEntries.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: '#252525', borderBottom: '1px solid #2a2a2a' }}>
          <span className="text-[10px] text-[#888]">{selectedEntries.size} selected</span>
          <Button size="sm" variant="ghost" className="h-5 text-[10px]" onClick={bulkPublish}>Publish</Button>
          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-red-400" onClick={bulkDelete}>Delete</Button>
          <Button size="sm" variant="ghost" className="h-5 text-[10px]" onClick={() => setSelectedEntries(new Set())}>Clear</Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        {filteredEntries.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[11px] text-[#666] mb-2">{searchQuery ? 'No matching entries' : 'No entries in this collection'}</p>
            {!searchQuery && (
              <Button size="sm" className="h-7 text-[11px]" onClick={() => { setNewEntryData({}); setNewEntryTitle(''); setShowNewEntry(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 group">
                <button onClick={() => setSelectedEntries(prev => { const s = new Set(prev); s.has(entry.id) ? s.delete(entry.id) : s.add(entry.id); return s; })} className="shrink-0">
                  {selectedEntries.has(entry.id) ? <CheckSquare className="h-3.5 w-3.5 text-purple-400" /> : <Square className="h-3.5 w-3.5 text-[#444]" />}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowEditEntry(entry)}>
                  <p className="text-[11px] font-medium truncate">{entry.title}</p>
                  <p className="text-[10px] text-[#555]">{new Date(entry.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0" style={{
                  borderColor: entry.status === 'published' ? '#22c55e' : entry.status === 'scheduled' ? '#f59e0b' : '#666',
                  color: entry.status === 'published' ? '#22c55e' : entry.status === 'scheduled' ? '#f59e0b' : '#888',
                }}>{entry.status}</Badge>
                <button onClick={() => togglePublish(entry)} className="text-[#666] hover:text-white p-0.5" title={entry.status === 'published' ? 'Unpublish' : 'Publish'}>
                  {entry.status === 'published' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
                <button onClick={() => { setShowSchedule(entry); setScheduleDate(''); }} className="text-[#666] hover:text-white p-0.5 opacity-0 group-hover:opacity-100" title="Schedule">
                  <Calendar className="h-3 w-3" />
                </button>
                <button onClick={() => duplicateEntry(entry)} className="text-[#666] hover:text-white p-0.5 opacity-0 group-hover:opacity-100" title="Duplicate">
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-[#666] hover:text-red-400 p-0.5">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Schedule Dialog */}
      <Dialog open={!!showSchedule} onOpenChange={() => setShowSchedule(null)}>
        <DialogContent className="sm:max-w-sm" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
          <DialogHeader><DialogTitle className="text-sm">Schedule Publication</DialogTitle></DialogHeader>
          <div>
            <label className="text-[11px] text-[#888] mb-1 block">Publish Date & Time</label>
            <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
          </div>
          <DialogFooter><Button size="sm" onClick={schedulePublish} disabled={!scheduleDate}>Schedule</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Entry Dialog */}
      <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
        <DialogContent className="sm:max-w-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
          <DialogHeader><DialogTitle className="text-sm">New {activeCollection.name} Entry</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[450px]">
            <div className="space-y-3 pr-2">
              <div>
                <label className="text-[11px] text-[#888] mb-1 block">Title *</label>
                <Input value={newEntryTitle} onChange={e => setNewEntryTitle(e.target.value)} className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
              </div>
              {activeCollection.fields.map(field => (
                <div key={field.slug}>
                  <label className="text-[11px] text-[#888] mb-1 flex items-center gap-1">
                    {field.name} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.helpText && <p className="text-[9px] text-[#555] mb-1">{field.helpText}</p>}
                  {renderFieldInput(field, newEntryData[field.slug], val => setNewEntryData(prev => ({ ...prev, [field.slug]: val })))}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter><Button size="sm" onClick={createEntry} disabled={!newEntryTitle.trim()}>Create Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!showEditEntry} onOpenChange={() => setShowEditEntry(null)}>
        {showEditEntry && (
          <DialogContent className="sm:max-w-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
            <DialogHeader><DialogTitle className="text-sm">Edit Entry</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[450px]">
              <div className="space-y-3 pr-2">
                <div>
                  <label className="text-[11px] text-[#888] mb-1 block">Title</label>
                  <Input defaultValue={showEditEntry.title} onBlur={e => updateEntry(showEditEntry, { title: e.target.value } as any)} className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
                </div>
                <div>
                  <label className="text-[11px] text-[#888] mb-1 block">Slug</label>
                  <Input defaultValue={showEditEntry.slug} onBlur={e => updateEntry(showEditEntry, { slug: e.target.value } as any)} className="h-8 text-[12px]" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', color: '#ccc' }} />
                </div>
                {activeCollection.fields.map(field => (
                  <div key={field.slug}>
                    <label className="text-[11px] text-[#888] mb-1 flex items-center gap-1">
                      {field.name} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {renderFieldInput(field, (showEditEntry.data as any)?.[field.slug], val => updateEntry(showEditEntry, { data: { ...(showEditEntry.data as any), [field.slug]: val } } as any), true)}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px]" style={{
                  borderColor: showEditEntry.status === 'published' ? '#22c55e' : '#666',
                  color: showEditEntry.status === 'published' ? '#22c55e' : '#888',
                }}>{showEditEntry.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => setShowEditEntry(null)}>Done</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Field Editor Dialog */}
      <Dialog open={showFieldEditor} onOpenChange={setShowFieldEditor}>
        <DialogContent className="sm:max-w-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#ccc' }}>
          <DialogHeader><DialogTitle className="text-sm">Edit Fields — {activeCollection.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {activeCollection.fields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                <GripVertical className="h-3 w-3 text-[#444] shrink-0" />
                <span className="text-[11px] flex-1">{field.name}</span>
                <Badge variant="outline" className="text-[9px] h-4">{field.type}</Badge>
                {field.required && <Badge variant="outline" className="text-[9px] h-4 text-red-400 border-red-400/30">req</Badge>}
                <button onClick={() => {
                  const updated = activeCollection.fields.filter((_, i) => i !== idx);
                  updateCollectionFields(updated);
                }} className="text-[#666] hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            {activeCollection.fields.length === 0 && <p className="text-[11px] text-[#555] text-center py-2">No fields defined</p>}
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" className="text-[10px]" onClick={() => {
              const name = prompt('Field name:');
              if (!name) return;
              const updated = [...activeCollection.fields, { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), type: 'text' as const }];
              updateCollectionFields(updated);
            }}><Plus className="h-3 w-3 mr-1" /> Add Field</Button>
          </div>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setShowFieldEditor(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
