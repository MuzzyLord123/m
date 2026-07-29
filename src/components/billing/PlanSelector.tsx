import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface PlanSelectorProps {
  plans: PlanOption[];
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
}

const PlanSelector = ({ plans, selectedPlan, onSelectPlan }: PlanSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {plans.map((plan, index) => (
        <motion.button
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectPlan(plan.id)}
          className={cn(
            "relative text-left rounded-xl border-2 p-3 transition-all duration-300",
            selectedPlan === plan.id
              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
              : "border-border/50 hover:border-border hover:bg-muted/30",
            plan.popular && selectedPlan !== plan.id && "border-primary/30"
          )}
        >
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              Popular
            </Badge>
          )}
          
          {selectedPlan === plan.id && (
            <div className="absolute top-2 right-2">
              <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            </div>
          )}
          
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{plan.name}</h3>
            <p className="text-[10px] text-muted-foreground">{plan.description}</p>
          </div>
          
          <div className="mb-2">
            <span className="text-xl font-bold">Custom Quote</span>
          </div>
          
          <ul className="space-y-0.5">
            {plan.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-1 text-[10px]">
                <Check className={cn(
                  "h-2.5 w-2.5 flex-shrink-0",
                  selectedPlan === plan.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="truncate">{feature}</span>
              </li>
            ))}
            {plan.features.length > 3 && (
              <li className="text-[10px] text-muted-foreground pl-3.5">
                +{plan.features.length - 3} more
              </li>
            )}
          </ul>
        </motion.button>
      ))}
    </div>
  );
};

export default PlanSelector;
