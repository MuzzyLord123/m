import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-full h-9 w-9"
      onClick={() => navigate('/lounge/notifications')}
    >
      <Bell className="h-[18px] w-[18px]" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
