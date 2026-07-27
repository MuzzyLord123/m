import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const INDUSTRIES = [
  // A
  'Accounting & Finance',
  'Advertising & Marketing',
  'Aerospace & Defence',
  'Agriculture & Farming',
  'Architecture & Design',
  'Arts & Crafts',
  'Automotive',
  // B
  'Banking & Financial Services',
  'Beauty & Salon',
  'Biotechnology',
  'Broadcasting & Media',
  'Building & Construction',
  // C
  'Catering & Food Services',
  'Charity & Non-Profit',
  'Childcare & Education',
  'Cleaning Services',
  'Clothing & Fashion',
  'Coaching & Mentoring',
  'Computer & IT Services',
  'Consulting',
  'Courier & Delivery',
  // D
  'Dental Services',
  'Digital Marketing',
  // E
  'E-commerce & Online Retail',
  'Education & Training',
  'Electrical Services',
  'Electronics',
  'Energy & Utilities',
  'Engineering',
  'Entertainment & Events',
  'Environmental Services',
  // F
  'Film & Photography',
  'Financial Planning',
  'Fitness & Gym',
  'Florist & Gardening',
  'Food & Beverage',
  'Franchise',
  'Freight & Logistics',
  'Funeral Services',
  'Furniture & Interiors',
  // G
  'Gaming & Esports',
  'Government & Public Sector',
  'Graphic Design',
  // H
  'Hair & Beauty',
  'Healthcare & Medical',
  'Heating & Plumbing',
  'Home Improvement',
  'Hospitality & Hotels',
  'Human Resources',
  // I
  'Import & Export',
  'Information Technology',
  'Insurance',
  'Interior Design',
  // J
  'Jewellery & Watches',
  'Journalism & Publishing',
  // L
  'Landscaping & Gardening',
  'Legal Services',
  'Leisure & Recreation',
  'Library & Information',
  // M
  'Manufacturing',
  'Marine & Shipping',
  'Mechanical Services',
  'Media & Communications',
  'Mining & Resources',
  'Mobile App Development',
  'Motor Trade',
  'Music & Audio',
  // N
  'Nursing & Care',
  'Nutrition & Dietetics',
  // O
  'Oil & Gas',
  'Optical & Eyecare',
  // P
  'Packaging',
  'Painting & Decorating',
  'Pest Control',
  'Pet Services & Veterinary',
  'Pharmaceuticals',
  'Photography & Videography',
  'Plastics & Rubber',
  'Plumbing & Heating',
  'Printing & Publishing',
  'Property & Real Estate',
  'Public Relations',
  // R
  'Recruitment & Staffing',
  'Removals & Storage',
  'Renewable Energy',
  'Restaurant & Café',
  'Retail',
  'Roofing & Building',
  // S
  'Security Services',
  'Social Media Management',
  'Software Development',
  'Solar & Green Energy',
  'Sports & Fitness',
  'Surveying',
  // T
  'Tattoo & Body Art',
  'Taxi & Private Hire',
  'Telecommunications',
  'Textiles',
  'Tourism & Travel',
  'Trading & Investments',
  'Training & Development',
  'Translation & Languages',
  'Transport & Haulage',
  'Tree Surgery & Arboriculture',
  // U
  'Upholstery',
  // V
  'Venue Hire',
  'Veterinary',
  // W
  'Waste Management & Recycling',
  'Web Design & Development',
  'Wedding Services',
  'Wellness & Spa',
  'Wholesale & Distribution',
  // Other
  'Other',
] as const;

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function IndustryCombobox({ value, onChange, disabled, className }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return INDUSTRIES;
    const q = search.toLowerCase();
    return INDUSTRIES.filter(ind => ind.toLowerCase().includes(q));
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value || 'Select your industry'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-lg z-50" align="start">
        <div className="flex items-center border-b border-border px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Type to search industries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[240px]">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No industries found.
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((industry) => (
                <button
                  key={industry}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                    value === industry && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => {
                    onChange(industry === value ? '' : industry);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === industry ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {industry}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
