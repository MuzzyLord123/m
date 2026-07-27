import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Globe, 
  Megaphone, 
  Share2, 
  Search, 
  Palette, 
  HeadphonesIcon,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface WebsitePackage {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  icon: React.ElementType;
}

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  type: 'website' | 'addon' | 'custom';
}

interface InvoiceManagerProps {
  clientName: string;
  clientEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendInvoice: (items: InvoiceItem[], notes: string) => void;
}

const WEBSITE_PACKAGES: WebsitePackage[] = [
  { id: 'starter-site', name: 'Starter Website', price: 499, description: '1-5 pages' },
  { id: 'business-site', name: 'Business Website', price: 999, description: '5-10 pages' },
  { id: 'premium-site', name: 'Premium Website', price: 1999, description: '10-20 pages' },
  { id: 'enterprise-site', name: 'Enterprise Website', price: 4999, description: 'Unlimited pages' },
  { id: 'ecommerce-site', name: 'E-commerce Website', price: 2999, description: 'Full online store' },
  { id: 'custom-site', name: 'Custom Quote', price: 0, description: 'Bespoke pricing' },
];

const AVAILABLE_ADDONS: Addon[] = [
  { id: 'ad-management', name: 'Ad Management', price: 199, icon: Megaphone },
  { id: 'social-media', name: 'Social Media Management', price: 149, icon: Share2 },
  { id: 'seo', name: 'SEO Strategy', price: 199, icon: Search },
  { id: 'branding', name: 'Branding & Design', price: 99, icon: Palette },
  { id: 'support-plus', name: 'Priority Support', price: 49, icon: HeadphonesIcon },
];

const InvoiceManager = ({
  clientName,
  clientEmail,
  open,
  onOpenChange,
  onSendInvoice
}: InvoiceManagerProps) => {
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [customWebsitePrice, setCustomWebsitePrice] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<{ name: string; price: number }[]>([]);
  const [newCustomItem, setNewCustomItem] = useState({ name: '', price: 0 });
  const [notes, setNotes] = useState('');

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  const addCustomItem = () => {
    if (newCustomItem.name && newCustomItem.price > 0) {
      setCustomItems(prev => [...prev, { ...newCustomItem }]);
      setNewCustomItem({ name: '', price: 0 });
    }
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendInvoice = () => {
    const items: InvoiceItem[] = [];

    // Add website package
    if (selectedWebsite) {
      const pkg = WEBSITE_PACKAGES.find(p => p.id === selectedWebsite);
      if (pkg) {
        const price = pkg.id === 'custom-site' ? customWebsitePrice : pkg.price;
        items.push({
          id: pkg.id,
          name: pkg.name,
          price,
          type: 'website'
        });
      }
    }

    // Add addons
    selectedAddons.forEach(addonId => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === addonId);
      if (addon) {
        items.push({
          id: addon.id,
          name: addon.name,
          price: addon.price,
          type: 'addon'
        });
      }
    });

    // Add custom items
    customItems.forEach((item, index) => {
      items.push({
        id: `custom-${index}`,
        name: item.name,
        price: item.price,
        type: 'custom'
      });
    });

    if (items.length === 0) {
      toast.error('Please add at least one item to the invoice');
      return;
    }

    onSendInvoice(items, notes);
    onOpenChange(false);
    
    // Reset form
    setSelectedWebsite(null);
    setCustomWebsitePrice(0);
    setSelectedAddons(new Set());
    setCustomItems([]);
    setNotes('');
  };

  // Calculate totals
  const websitePrice = selectedWebsite 
    ? (selectedWebsite === 'custom-site' 
        ? customWebsitePrice 
        : WEBSITE_PACKAGES.find(p => p.id === selectedWebsite)?.price || 0)
    : 0;
  
  const addonsPrice = Array.from(selectedAddons).reduce((sum, id) => {
    const addon = AVAILABLE_ADDONS.find(a => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const customPrice = customItems.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = websitePrice + addonsPrice + customPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Invoice for {clientName}
          </DialogTitle>
          <DialogDescription>
            Configure the invoice items. The client will receive a payment link at {clientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Website Package */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website Package
            </Label>
            <Select value={selectedWebsite || ''} onValueChange={setSelectedWebsite}>
              <SelectTrigger>
                <SelectValue placeholder="Select a website package..." />
              </SelectTrigger>
              <SelectContent>
                {WEBSITE_PACKAGES.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{pkg.name} ({pkg.description})</span>
                      <span className="text-muted-foreground">
                        {pkg.price > 0 ? `£${pkg.price}` : 'Custom'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedWebsite === 'custom-site' && (
              <div className="flex items-center gap-2">
                <Label>Custom Price (£)</Label>
                <Input
                  type="number"
                  value={customWebsitePrice}
                  onChange={(e) => setCustomWebsitePrice(Number(e.target.value))}
                  className="w-32"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Add-ons */}
          <div className="space-y-3">
            <Label>Monthly Add-ons</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_ADDONS.map((addon) => {
                const Icon = addon.icon;
                const isActive = selectedAddons.has(addon.id);
                
                return (
                  <div 
                    key={addon.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium text-sm">{addon.name}</p>
                        <p className="text-xs text-muted-foreground">£{addon.price}/mo</p>
                      </div>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleAddon(addon.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Custom Items */}
          <div className="space-y-3">
            <Label>Custom One-off Charges</Label>
            
            {customItems.length > 0 && (
              <div className="space-y-2">
                {customItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span>£{item.price}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeCustomItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Item description..."
                value={newCustomItem.name}
                onChange={(e) => setNewCustomItem(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Price"
                className="w-28"
                value={newCustomItem.price || ''}
                onChange={(e) => setNewCustomItem(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
              <Button variant="outline" size="icon" onClick={addCustomItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Invoice Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for the client..."
              rows={3}
            />
          </div>

          {/* Total Preview */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {websitePrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Website (one-time)</span>
                    <span>£{websitePrice.toLocaleString()}</span>
                  </div>
                )}
                {addonsPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-ons (monthly)</span>
                    <span>£{addonsPrice}/mo</span>
                  </div>
                )}
                {customPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Custom charges</span>
                    <span>£{customPrice.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Due</span>
                  <span>£{totalPrice.toLocaleString()}</span>
                </div>
                {addonsPrice > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    + £{addonsPrice}/mo recurring
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvoice} className="gap-2">
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceManager;
