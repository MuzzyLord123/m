import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Package, FileText, Upload, MessageSquare, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-muted/50 mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {(actionLabel && (onAction || actionHref)) && (
        <Button
          onClick={onAction}
          asChild={!!actionHref}
        >
          {actionHref ? (
            <a href={actionHref}>{actionLabel}</a>
          ) : (
            actionLabel
          )}
        </Button>
      )}
      {children}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios
export function NoProjectsEmptyState({ onBrowsePackages }: { onBrowsePackages?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No active projects"
      description="Start your digital journey with one of our premium packages."
      actionLabel="Browse Packages"
      onAction={onBrowsePackages}
    />
  );
}

export function NoContentEmptyState({ onCreateRequest }: { onCreateRequest?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No content requests yet"
      description="Request blog posts, copy, or other content for your projects."
      actionLabel="Create Request"
      onAction={onCreateRequest}
    />
  );
}

export function NoUploadsEmptyState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="No uploads yet"
      description="Drag files here or click to upload documents, images, and more."
      actionLabel="Upload Files"
      onAction={onUpload}
    />
  );
}

export function NoMessagesEmptyState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="Start a conversation with your project team."
    />
  );
}

export function NoEventsEmptyState({ onSchedule }: { onSchedule?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming events"
      description="Your marketing calendar is empty. Schedule your first event."
      actionLabel="Schedule Event"
      onAction={onSchedule}
    />
  );
}

export function NoTeamEmptyState({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Just you for now"
      description="Invite team members to collaborate on your projects."
      actionLabel="Invite Member"
      onAction={onInvite}
    />
  );
}
