import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Search, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'year' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onCreateEvent: () => void;
  onSearch: (query: string) => void;
}

export function CalendarHeader({
  currentDate, viewMode, onViewModeChange, onNavigate, onCreateEvent, onSearch,
}: CalendarHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const getTitle = () => {
    switch (viewMode) {
      case 'month': return format(currentDate, 'MMM yyyy');
      case 'week': return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'day': return format(currentDate, 'EEE, MMM d');
      case 'year': return format(currentDate, 'yyyy');
      case 'agenda': return 'Upcoming';
    }
  };

  const views: CalendarViewMode[] = ['day', 'week', 'month', 'year', 'agenda'];

  return (
    <div className="flex flex-col gap-2 pb-3">
      {/* Row 1: nav + title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="text-xs font-medium h-8 px-3 shrink-0"
        >
          Today
        </Button>

        <div className="flex items-center shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onNavigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-sm sm:text-lg font-semibold whitespace-nowrap tracking-tight ml-1 truncate">{getTitle()}</h2>
      </div>

      {/* Row 2: search + views + create */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {/* Search */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Input
                ref={inputRef}
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
                className="h-8 pr-7 text-sm"
              />
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); onSearch(''); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button key="search-btn" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSearchOpen(true)}>
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Search events <kbd className="ml-1 text-[10px] bg-muted px-1 py-0.5 rounded">/</kbd></p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </AnimatePresence>

        {/* View mode toggle */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          {views.map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`relative px-2.5 py-1.5 text-[11px] font-medium capitalize rounded-md transition-all duration-200 ${
                viewMode === mode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {viewMode === mode && (
                <motion.div
                  layoutId="calendar-view-pill"
                  className="absolute inset-0 bg-background rounded-md shadow-sm border border-border/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{mode}</span>
            </button>
          ))}
        </div>

        <Button size="sm" onClick={onCreateEvent} className="gap-1.5 h-8 rounded-lg shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">New Event</span>
        </Button>
      </div>
    </div>
  );
}
