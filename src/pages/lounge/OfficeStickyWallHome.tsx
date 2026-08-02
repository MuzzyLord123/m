import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, Plus, Clock, Star, Grid3X3, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface WallRow {
  id: string;
  name: string;
  is_starred: boolean;
  notes: any[];
  created_at: string;
  updated_at: string;
}

export default function OfficeStickyWallHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walls, setWalls] = useState<WallRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalls = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('sticky_walls')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setWalls((data as any as WallRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchWalls(); }, [user?.id]);

  const createNewWall = () => navigate('/lounge/office/sticky-wall', { state: { fromOfficeApp: true } });
  const openWall = (id: string) => navigate(`/lounge/office/sticky-wall?id=${id}`, { state: { fromOfficeApp: true } });

  const toggleStar = async (e: React.MouseEvent, wall: WallRow) => {
    e.stopPropagation();
    await supabase.from('sticky_walls').update({ is_starred: !wall.is_starred }).eq('id', wall.id);
    setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, is_starred: !w.is_starred } : w));
  };

  const deleteWall = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from('sticky_walls').delete().eq('id', id);
    setWalls(prev => prev.filter(w => w.id !== id));
    toast.success('Wall deleted');
  };

  const NOTE_COLORS_MAP: Record<string, string> = {
    '#fef3c7': '#fef3c7', '#fce7f3': '#fce7f3', '#d1fae5': '#d1fae5',
    '#dbeafe': '#dbeafe', '#ede9fe': '#ede9fe', '#ffedd5': '#ffedd5',
  };

  const getPreviewColors = (notes: any[]) => {
    if (!notes?.length) return ['#fef3c7'];
    return [...new Set(notes.slice(0, 4).map((n: any) => n.color || '#fef3c7'))];
  };

  const starred = walls.filter(w => w.is_starred);
  const recent = walls.filter(w => !w.is_starred);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <OfficeModuleBand appId="sticky" icon={StickyNote} title="Sticky wall" context={walls.length ? `${walls.length} ${walls.length === 1 ? 'wall' : 'walls'}` : undefined}>
        <Button size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={createNewWall}>
          <Plus className="h-3.5 w-3.5" /> New wall
        </Button>
      </OfficeModuleBand>

      <div className="flex-1 overflow-auto bg-card/45">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="pb-6 pt-7">
            <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.02em]">Your walls</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Visual notes and spatial thinking, saved to your workspace.</p>
          </div>

          {/* Quick actions */}
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'New Blank Wall', desc: 'Start with empty canvas', icon: Plus, color: '#eab308' },
                { label: 'From Template', desc: 'Sprint retro, brainstorm, etc.', icon: Grid3X3, color: '#8b5cf6' },
                { label: 'Quick Note', desc: 'Add a single sticky note', icon: StickyNote, color: '#ec4899' },
              ].map((action, i) => (
                <motion.button key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={createNewWall}
                  className="group flex items-center gap-4 p-5 rounded-[14px] border border-border/40 bg-card transition-colors hover:bg-foreground/[0.03]">
                  <div className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 bg-foreground/[0.05]">
                    <action.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
                  </div>
                  <div className="text-left">
                    <span className="text-[12px] font-semibold text-foreground block">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{action.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[14px] bg-foreground/[0.04] animate-pulse" />)}
            </div>
          ) : walls.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/50 text-sm">
              No walls yet. Create your first one!
            </div>
          ) : (
            <>
              {/* Starred */}
              {starred.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star className="h-3 w-3" /> Starred</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {starred.map(wall => (
                      <WallCard key={wall.id} wall={wall} onClick={() => openWall(wall.id)} onToggleStar={toggleStar} onDelete={deleteWall} getPreviewColors={getPreviewColors} />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent */}
              <section className="pb-10">
                <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Clock className="h-3 w-3" /> {starred.length > 0 ? 'Recent' : 'All Walls'}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(starred.length > 0 ? recent : walls).map(wall => (
                    <WallCard key={wall.id} wall={wall} onClick={() => openWall(wall.id)} onToggleStar={toggleStar} onDelete={deleteWall} getPreviewColors={getPreviewColors} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WallCard({ wall, onClick, onToggleStar, onDelete, getPreviewColors }: {
  wall: WallRow;
  onClick: () => void;
  onToggleStar: (e: React.MouseEvent, wall: WallRow) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getPreviewColors: (notes: any[]) => string[];
}) {
  const colors = getPreviewColors(wall.notes);
  const noteCount = wall.notes?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(wall.updated_at), { addSuffix: true });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClick}
      className="group p-5 rounded-[14px] border border-border/40 bg-card transition-colors hover:bg-foreground/[0.03] text-left cursor-pointer relative">
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={e => onToggleStar(e, wall)} className="h-6 w-6 rounded-md hover:bg-accent/40 flex items-center justify-center">
          <Star className={cn("h-3 w-3", wall.is_starred ? "fill-attend text-attend" : "text-muted-foreground")} />
        </button>
        <button onClick={e => onDelete(e, wall.id)} className="h-6 w-6 rounded-md hover:bg-destructive/10 flex items-center justify-center">
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {/* Preview dots */}
      <div className="flex gap-1.5 mb-4">
        {colors.map((c, i) => (
          <div key={i} className="h-8 w-8 rounded-lg shadow-sm" style={{ background: c }} />
        ))}
      </div>
      <h3 className="text-[13px] font-semibold text-foreground mb-1">{wall.name}</h3>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/45">
        <span>{noteCount} notes</span>
        <span>·</span>
        <span>{timeAgo}</span>
      </div>
    </motion.div>
  );
}
