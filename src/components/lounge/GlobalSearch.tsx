import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, Globe, Layout, FileText, Megaphone, Share2,
  Calendar, HardDrive, Upload, Users, CreditCard, MessageSquare,
  Settings, Home, ArrowRight, X, Clock, Code, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SearchItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  keywords: string[];
  category: string;
}

const searchItems: SearchItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview of all your projects', icon: Home, path: '/lounge', keywords: ['home', 'overview', 'main'], category: 'Pages' },
  { id: 'website', label: 'Website', description: 'Manage your website project', icon: Globe, path: '/lounge/website', keywords: ['site', 'web', 'domain'], category: 'Pages' },
  { id: 'apps', label: 'App Projects', description: 'View your applications', icon: Layout, path: '/lounge/apps', keywords: ['application', 'dashboard', 'software'], category: 'Pages' },
  { id: 'content', label: 'Content Requests', description: 'Request and track content', icon: FileText, path: '/lounge/content', keywords: ['blog', 'copy', 'writing'], category: 'Pages' },
  { id: 'seo', label: 'SEO Checker', description: 'Analyze your SEO performance', icon: Search, path: '/lounge/seo-checker', keywords: ['search', 'optimization', 'google'], category: 'Pages' },
  { id: 'ads', label: 'Ad Campaigns', description: 'Manage advertising campaigns', icon: Megaphone, path: '/lounge/ads', keywords: ['advertising', 'ppc', 'facebook', 'google ads'], category: 'Pages' },
  { id: 'social', label: 'Social Media', description: 'Schedule and manage posts', icon: Share2, path: '/lounge/social', keywords: ['facebook', 'instagram', 'twitter', 'linkedin'], category: 'Pages' },
  { id: 'calendar', label: 'Marketing Calendar', description: 'Plan your marketing schedule', icon: Calendar, path: '/lounge/calendar', keywords: ['schedule', 'planning', 'dates'], category: 'Pages' },
  { id: 'assets', label: 'Asset Storage', description: 'Managed brand assets', icon: HardDrive, path: '/lounge/assets', keywords: ['files', 'images', 'documents', 'storage'], category: 'Pages' },
  { id: 'uploads', label: 'Uploads', description: 'Your uploaded files', icon: Upload, path: '/lounge/uploads', keywords: ['files', 'upload', 'documents'], category: 'Pages' },
  { id: 'team', label: 'Team', description: 'Manage team members', icon: Users, path: '/lounge/team', keywords: ['members', 'users', 'permissions'], category: 'Pages' },
  { id: 'billing', label: 'Plan & Billing', description: 'View invoices and plan details', icon: CreditCard, path: '/lounge/billing', keywords: ['invoice', 'payment', 'subscription'], category: 'Pages' },
  { id: 'messages', label: 'Messages', description: 'Chat with your team', icon: MessageSquare, path: '/lounge/messages', keywords: ['chat', 'support', 'communication'], category: 'Pages' },
  { id: 'settings', label: 'Settings', description: 'Account and preferences', icon: Settings, path: '/lounge/settings', keywords: ['account', 'profile', 'preferences', 'password'], category: 'Pages' },
];

interface GlobalSearchProps {
  className?: string;
}

interface LiveResult {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveResults, setLiveResults] = useState<LiveResult[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Filter page results based on query
  const pageResults = useMemo(() => {
    if (!query.trim()) return searchItems;
    const q = query.toLowerCase();
    return searchItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    );
  }, [query]);

  // Live search against database
  useEffect(() => {
    if (!query.trim() || query.length < 2 || !user) {
      setLiveResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const [projectsRes, contentRes] = await Promise.all([
          supabase
            .from('app_projects')
            .select('id, project_name, status')
            .ilike('project_name', `%${query}%`)
            .limit(5),
          supabase
            .from('content_requests')
            .select('id, title, status')
            .ilike('title', `%${query}%`)
            .limit(5),
        ]);

        const results: LiveResult[] = [];
        
        (projectsRes.data || []).forEach(p => {
          results.push({
            id: `project-${p.id}`,
            label: p.project_name,
            description: `App Project • ${p.status}`,
            icon: Code,
            path: '/lounge/apps',
            category: 'Projects',
          });
        });

        (contentRes.data || []).forEach(c => {
          results.push({
            id: `content-${c.id}`,
            label: c.title,
            description: `Content Request • ${c.status}`,
            icon: Briefcase,
            path: '/lounge/content',
            category: 'Content',
          });
        });

        setLiveResults(results);
      } catch {
        // Silently fail
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user]);

  // Combined results
  const allResults = useMemo(() => {
    return [...pageResults, ...liveResults];
  }, [pageResults, liveResults]);

  // Group results by category
  const groupedResults = useMemo(() =>
    allResults.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, (SearchItem | LiveResult)[]>),
  [allResults]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setLiveResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          navigate(allResults[selectedIndex].path);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }, [allResults, selectedIndex, navigate]);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-muted-foreground hover:text-foreground",
          className
        )}
        aria-label="Open search (Cmd+K)"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-background rounded border border-border">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>
          
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, projects, content..."
              className="border-0 bg-transparent focus-visible:ring-0 px-0 text-base placeholder:text-muted-foreground/60"
            />
            {searching && (
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin flex-shrink-0" />
            )}
            {query && !searching && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {Object.entries(groupedResults).length > 0 ? (
              Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">{category}</p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const flatIndex = allResults.indexOf(item);
                      const isSelected = flatIndex === selectedIndex;
                      const Icon = item.icon;
                      
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected ? "bg-primary-foreground/20" : "bg-muted"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.label}</p>
                            <p className={cn(
                              "text-sm truncate",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className={cn(
                            "w-4 h-4 flex-shrink-0 transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0"
                          )} />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Try searching for something else</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↑↓</kbd>
                navigate
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">esc</kbd>
              close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
