import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  isActive: boolean;
  onToggle: () => void;
  popular?: boolean;
  disabled?: boolean;
}

const ServiceCard = ({
  name,
  description,
  price,
  features,
  isActive,
  onToggle,
  popular = false,
  disabled = false
}: ServiceCardProps) => {
  return (
    <div
      className={cn(
        "relative group rounded-2xl border-2 p-6 transition-all duration-300",
        isActive 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
          : "border-border/50 hover:border-border",
        disabled && "opacity-50 cursor-not-allowed",
        popular && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="ml-4"
        />
      </div>
      
      <div className="mb-4">
        <span className="text-3xl font-bold">£{price}</span>
        <span className="text-muted-foreground">/mo</span>
      </div>
      
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <Check className={cn(
              "h-4 w-4 flex-shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={isActive ? "" : "text-muted-foreground"}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServiceCard;
