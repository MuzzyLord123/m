import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Circle, 
  CheckCircle2, 
  Clock,
  FileText,
  Key,
  Github,
  Users,
  HeadphonesIcon,
  PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ChecklistItem {
  id: string;
  step: string;
  title: string;
  description: string;
  timing: string;
  icon: React.ElementType;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "signoff",
    step: "01",
    title: "Project Completion Sign-off",
    description: "Final review meeting to confirm all deliverables meet requirements.",
    timing: "1-2 days",
    icon: FileText
  },
  {
    id: "documentation",
    step: "02",
    title: "Documentation Package",
    description: "Comprehensive documentation including technical specs, admin guides, and maintenance procedures.",
    timing: "2-3 days",
    icon: FileText
  },
  {
    id: "credentials",
    step: "03",
    title: "Credentials & Access Transfer",
    description: "Secure transfer of all credentials, API keys, and service access.",
    timing: "1 day",
    icon: Key
  },
  {
    id: "repository",
    step: "04",
    title: "Repository Transfer",
    description: "GitHub repository transfer or encrypted file delivery.",
    timing: "Same day",
    icon: Github
  },
  {
    id: "knowledge",
    step: "05",
    title: "Knowledge Transfer Session",
    description: "Live walkthrough of the system architecture and codebase with your team.",
    timing: "1-2 hours",
    icon: Users
  },
  {
    id: "support",
    step: "06",
    title: "Support Transition",
    description: "30-day post-handover support period to address any questions.",
    timing: "30 days",
    icon: HeadphonesIcon
  }
];

const STORAGE_KEY = "handover-checklist-progress";

export function HandoverChecklist() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedItems(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse checklist progress", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedItems)));
  }, [completedItems]);

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const resetProgress = () => {
    setCompletedItems(new Set());
    localStorage.removeItem(STORAGE_KEY);
  };

  const progress = (completedItems.size / checklistItems.length) * 100;
  const isComplete = completedItems.size === checklistItems.length;

  return (
    <div className="p-6 lg:p-8 rounded-3xl liquid-glass-card border border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display font-bold text-xl lg:text-2xl mb-1">
            Your Handover Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Track your project handover in real-time
          </p>
        </div>
        {completedItems.size > 0 && (
          <Button variant="outline" size="sm" onClick={resetProgress}>
            Reset Progress
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completedItems.size} of {checklistItems.length} completed
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Completion Celebration */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 text-center"
        >
          <PartyPopper className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h4 className="font-display font-bold text-xl mb-2">
            Handover Complete!
          </h4>
          <p className="text-muted-foreground">
            Congratulations! Your project has been fully transferred. 
            You now have complete ownership.
          </p>
        </motion.div>
      )}

      {/* Checklist Items */}
      <div className="space-y-4">
        {checklistItems.map((item, index) => {
          const isCompleted = completedItems.has(item.id);
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleItem(item.id)}
              className={`p-4 lg:p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                isCompleted
                  ? "bg-primary/10 border-primary/40"
                  : "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step Indicator */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="font-mono text-sm font-bold">{item.step}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      isCompleted ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <h4 className={`font-semibold ${
                      isCompleted ? "text-primary" : "text-foreground"
                    }`}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{item.timing}</span>
                  </div>
                </div>

                {/* Checkbox Visual */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/50"
                }`}>
                  {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}