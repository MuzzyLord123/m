import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, Pin, PinOff, Edit2, Trash2, Eye, ArrowLeft,
  Tag, Clock, User, Filter, ChevronDown, FileText, Code, Wrench, BookMarked,
  MoreVertical, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  author_id: string;
  last_edited_by: string | null;
  pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'process', label: 'Processes', icon: BookMarked },
  { value: 'script', label: 'Scripts', icon: Code },
  { value: 'build-standard', label: 'Build Standards', icon: Wrench },
  { value: 'onboarding', label: 'Onboarding', icon: User },
  { value: 'general', label: 'General', icon: FileText },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-attend/10 text-attend border-attend/25',
  published: 'bg-ok/10 text-ok border-ok/25',
  archived: 'bg-muted text-muted-foreground border-border',
};

const categoryColors: Record<string, string> = {
  process: 'bg-foreground/[0.06] text-ink-2 border-border/60',
  script: 'bg-foreground/[0.06] text-ink-2 border-border/60',
  'build-standard': 'bg-foreground/[0.06] text-ink-2 border-border/60',
  onboarding: 'bg-foreground/[0.06] text-ink-2 border-border/60',
  general: 'bg-muted text-muted-foreground border-border',
};

export default function AdminKnowledgeBase() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor state
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState<KBArticle | null>(null);
  const [editArticle, setEditArticle] = useState<Partial<KBArticle>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KBArticle | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) {
      toast.error('Failed to load knowledge base');
    } else {
      setArticles((data as KBArticle[]) || []);
    }
    setLoading(false);
  };

  const filtered = articles.filter(a => {
    const matchSearch = !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const startNew = () => {
    setEditArticle({ title: '', content: '', category: 'general', tags: [], status: 'draft', pinned: false });
    setEditing(true);
    setPreviewMode(false);
    setTagInput('');
  };

  const startEdit = (article: KBArticle) => {
    setEditArticle({ ...article });
    setEditing(true);
    setPreviewMode(false);
    setTagInput('');
  };

  const handleSave = async () => {
    if (!editArticle.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: editArticle.title!.trim(),
      content: editArticle.content || '',
      category: editArticle.category || 'general',
      tags: editArticle.tags || [],
      status: editArticle.status || 'draft',
      pinned: editArticle.pinned || false,
      last_edited_by: user?.id,
    };

    if (editArticle.id) {
      const { error } = await supabase.from('knowledge_base').update(payload).eq('id', editArticle.id);
      if (error) toast.error('Failed to update'); else { toast.success('Article updated'); setEditing(false); fetchArticles(); }
    } else {
      const { error } = await supabase.from('knowledge_base').insert({ ...payload, author_id: user!.id });
      if (error) toast.error('Failed to create'); else { toast.success('Article created'); setEditing(false); fetchArticles(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('knowledge_base').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete'); else { toast.success('Article deleted'); setDeleteTarget(null); fetchArticles(); }
  };

  const togglePin = async (article: KBArticle) => {
    const { error } = await supabase.from('knowledge_base').update({ pinned: !article.pinned }).eq('id', article.id);
    if (error) toast.error('Failed to update'); else fetchArticles();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !(editArticle.tags || []).includes(tag)) {
      setEditArticle(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditArticle(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.icon : FileText;
  };

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    pinned: articles.filter(a => a.pinned).length,
  };

  // --- Viewing an article ---
  if (viewing) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setViewing(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Button>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={categoryColors[viewing.category] || categoryColors.general}>
                      {CATEGORIES.find(c => c.value === viewing.category)?.label || viewing.category}
                    </Badge>
                    <Badge variant="outline" className={statusColors[viewing.status]}>
                      {viewing.status}
                    </Badge>
                    {viewing.pinned && <Pin className="w-3.5 h-3.5 text-gold" />}
                  </div>
                  <CardTitle className="text-xl">{viewing.title}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { startEdit(viewing); setViewing(null); }}>
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {format(new Date(viewing.updated_at), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {viewing.view_count} views</span>
              </div>
              {viewing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewing.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{viewing.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // --- Editor ---
  if (editing) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Edit2 className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editArticle.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Input
            placeholder="Article title..."
            value={editArticle.title || ''}
            onChange={e => setEditArticle(prev => ({ ...prev, title: e.target.value }))}
            className="text-lg font-semibold"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={editArticle.category || 'general'} onValueChange={v => setEditArticle(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={editArticle.status || 'draft'} onValueChange={v => setEditArticle(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pinned</Label>
              <Button
                variant={editArticle.pinned ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => setEditArticle(prev => ({ ...prev, pinned: !prev.pinned }))}
              >
                {editArticle.pinned ? <Pin className="w-3.5 h-3.5 mr-1.5" /> : <PinOff className="w-3.5 h-3.5 mr-1.5" />}
                {editArticle.pinned ? 'Pinned' : 'Not Pinned'}
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="max-w-[200px]"
              />
              <Button variant="outline" size="sm" onClick={addTag}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
            {(editArticle.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(editArticle.tags || []).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <span className="text-muted-foreground">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {previewMode ? (
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm dark:prose-invert max-w-none min-h-[300px]">
                  <ReactMarkdown>{editArticle.content || '*No content yet...*'}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Content (Markdown supported)</Label>
              <Textarea
                placeholder="Write your SOP, process, or script here... Markdown is supported."
                value={editArticle.content || ''}
                onChange={e => setEditArticle(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Internal SOPs, processes, scripts & build standards</p>
        </div>
        <Button onClick={startNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Article
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: BookOpen },
          { label: 'Published', value: stats.published, icon: Check },
          { label: 'Drafts', value: stats.draft, icon: Edit2 },
          { label: 'Pinned', value: stats.pinned, icon: Pin },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search articles, tags..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No articles found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create your first SOP or process document</p>
            <Button onClick={startNew} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create Article</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((article, idx) => {
              const CatIcon = getCategoryIcon(article.category);
              return (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="group hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col" onClick={() => setViewing(article)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${categoryColors[article.category] || categoryColors.general}`}>
                            <CatIcon className="w-2.5 h-2.5 mr-1" />
                            {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusColors[article.status]}`}>
                            {article.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {article.pinned && <Pin className="w-3 h-3 text-gold" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => startEdit(article)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePin(article)}>
                                {article.pinned ? <PinOff className="w-3.5 h-3.5 mr-2" /> : <Pin className="w-3.5 h-3.5 mr-2" />}
                                {article.pinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(article.content); toast.success('Copied to clipboard'); }}>
                                <Copy className="w-3.5 h-3.5 mr-2" /> Copy Content
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(article)}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardTitle className="text-sm mt-2 line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                        {article.content.replace(/[#*`_\[\]]/g, '').substring(0, 150)}
                      </p>
                      <div className="space-y-2">
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {article.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {article.tags.length > 3 && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                +{article.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                          <span>{format(new Date(article.updated_at), 'MMM d, yyyy')}</span>
                          <span>{article.view_count} views</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
