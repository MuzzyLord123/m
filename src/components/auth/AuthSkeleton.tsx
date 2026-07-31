import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthSkeletonProps {
  message?: string;
}

export function AuthSkeleton({ message = 'Verifying access...' }: AuthSkeletonProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 via-transparent to-primary/10" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8 space-y-6">
          {/* Logo skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-14 w-32" />
          </div>
          
          {/* Title skeleton */}
          <div className="space-y-2 text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
          
          {/* Loading indicator */}
          <motion.div 
            className="flex flex-col items-center gap-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Custom spinner with smooth animation */}
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <motion.p 
              className="text-sm text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {message}
            </motion.p>
          </motion.div>
          
          {/* Form skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Lightweight inline skeleton for guards
export function GuardSkeleton({ message = 'Verifying access...' }: AuthSkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <motion.p 
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}
