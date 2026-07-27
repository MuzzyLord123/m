import { format, parseISO } from 'date-fns';
import { MapPin, Clock, Link2, Edit2, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface EventPopoverProps {
  event: CalendarEvent;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export function EventPopover({ event, position, onClose, onEdit, onDelete }: EventPopoverProps) {
  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);
  const attendees = (event.attendees as any[]) || [];

  // Position logic: keep within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 320),
    left: Math.min(position.x + 8, window.innerWidth - 320),
    zIndex: 100,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[99]" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={style}
        className="w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
      >
        {/* Color bar */}
        <div className="h-1.5" style={{ backgroundColor: event.color }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-foreground leading-tight">{event.title}</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            {event.is_all_day ? (
              <span>{format(start, 'EEEE, MMMM d, yyyy')} · All day</span>
            ) : (
              <span>
                {format(start, 'EEE, MMM d')} · {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
              </span>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Meeting link */}
          {event.meeting_link && (
            <div className="flex items-center gap-2 text-xs mb-2">
              <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <a
                href={event.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                Join meeting
              </a>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{attendees.length} guest{attendees.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-[11px] gap-1.5"
              onClick={() => onEdit(event)}
            >
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              onClick={() => { onDelete(event.id); onClose(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
