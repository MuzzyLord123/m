import { motion } from 'framer-motion';
import { Check, Globe, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface WebsitePackage {
  id: string;
  name: string;
  price: number;
  description: string;
  pages: string;
  features: string[];
  popular?: boolean;
}

interface WebsitePackageSelectorProps {
  packages: WebsitePackage[];
  selectedPackage: string | null;
  onSelectPackage: (id: string) => void;
}

const WebsitePackageSelector = ({
  packages,
  selectedPackage,
  onSelectPackage
}: WebsitePackageSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {packages.map((pkg, index) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectPackage(pkg.id)}
          className={`
            relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-300
            ${selectedPackage === pkg.id
              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
              : 'border-border/50 hover:border-border hover:bg-muted/30'
            }
          `}
        >
          {pkg.popular && (
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              Popular
            </Badge>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${selectedPackage === pkg.id ? 'bg-primary/20' : 'bg-muted'}`}>
              <Globe className={`h-4 w-4 ${selectedPackage === pkg.id ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            {selectedPackage === pkg.id && (
              <div className="ml-auto p-0.5 bg-primary rounded-full">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>

          <h3 className="font-bold text-sm mb-0.5 truncate">{pkg.name}</h3>
          <p className="text-[10px] text-muted-foreground mb-1">{pkg.pages}</p>

          <div className="flex items-baseline gap-0.5 mb-2">
            <span className="text-lg font-bold">Custom Quote</span>
          </div>

          <ul className="space-y-0.5">
            {pkg.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-1 text-[10px]">
                <Check className={`h-2.5 w-2.5 flex-shrink-0 ${selectedPackage === pkg.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`truncate ${selectedPackage === pkg.id ? '' : 'text-muted-foreground'}`}>{feature}</span>
              </li>
            ))}
            {pkg.features.length > 3 && (
              <li className="text-[10px] text-muted-foreground pl-3.5">
                +{pkg.features.length - 3} more
              </li>
            )}
          </ul>
        </motion.div>
      ))}
    </div>
  );
};

export default WebsitePackageSelector;
