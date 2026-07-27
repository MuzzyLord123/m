import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

interface BillingDetails {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

interface BillingDetailsFormProps {
  onBack: () => void;
  onSubmit: (details: BillingDetails) => void;
  isLoading?: boolean;
  initialData?: Partial<BillingDetails>;
}

const BillingDetailsForm = ({
  onBack,
  onSubmit,
  isLoading = false,
  initialData = {}
}: BillingDetailsFormProps) => {
  const [details, setDetails] = useState<BillingDetails>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    company: initialData.company || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    addressLine2: initialData.addressLine2 || '',
    city: initialData.city || '',
    county: initialData.county || '',
    postcode: initialData.postcode || '',
    country: initialData.country || 'GB'
  });

  const handleChange = (field: keyof BillingDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  const isValid = details.firstName && details.lastName && details.email && 
                  details.address && details.city && details.postcode;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Billing Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={details.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={details.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company name (optional)</Label>
            <Input
              id="company"
              value={details.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={details.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={details.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label>
              Country <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={details.country} 
              onValueChange={(v) => handleChange('country', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GB">United Kingdom (UK)</SelectItem>
                <SelectItem value="US">United States (US)</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="IE">Ireland</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">
                Street address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="House number and street name"
                value={details.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </div>
            <Input
              placeholder="Apartment, suite, unit etc. (optional)"
              value={details.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
            />
          </div>

          {/* City & County */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                Town / City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={details.city}
                onChange={(e) => handleChange('city', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="county">County (optional)</Label>
              <Input
                id="county"
                value={details.county}
                onChange={(e) => handleChange('county', e.target.value)}
              />
            </div>
          </div>

          {/* Postcode */}
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="postcode">
              Postcode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postcode"
              value={details.postcode}
              onChange={(e) => handleChange('postcode', e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-base font-semibold gap-2"
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Place Order
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillingDetailsForm;
