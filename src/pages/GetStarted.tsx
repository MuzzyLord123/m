import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  User,
  Building2,
  Globe,
  Palette,
  Rocket,
  Phone,
  Mail,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  Target,
  Instagram,
  Save,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useAutosave } from "@/hooks/useAutosave";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import heroWorkspace from "@/assets/hero-workspace.jpg";

const TOTAL_STEPS = 5;

const packages = [
  { id: "starter", name: "Starter Site", price: "Custom Quote", desc: "1-2 pages • Perfect for local services" },
  { id: "business", name: "Business Site", price: "Custom Quote", desc: "2-5 pages • For growing businesses" },
  { id: "growth", name: "Growth Site", price: "Custom Quote", desc: "6-10 pages • Ready to scale" },
  { id: "enterprise", name: "Enterprise & Custom", price: "Custom Quote", desc: "Complex builds • Tailored to you" },
  { id: "social", name: "Social Media Management", price: "Custom Quote", desc: "Complete platform management" },
];

const budgetRanges = [
  "Under £500",
  "£500 - £1,000",
  "£1,000 - £2,500",
  "£2,500 - £5,000",
  "£5,000+",
  "Not sure yet",
];

const timelines = [
  "ASAP - Within 1 week",
  "Within 2 weeks",
  "Within 1 month",
  "Within 2-3 months",
  "No rush - Planning ahead",
];

const businessTypes = [
  "Pub / Restaurant / Café",
  "Tradesman / Contractor",
  "Retail / Shop",
  "Professional Services",
  "Health & Beauty",
  "Property / Estate Agent",
  "Fitness / Gym",
  "Creative / Agency",
  "E-commerce",
  "Other",
];

const howDidYouHear = [
  "Google Search",
  "Social Media",
  "Referral / Word of Mouth",
  "Returning Client",
  "Other",
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 400 : -400,
    opacity: 0,
  }),
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  website: string;
  employeeCount: string;
  yearsInBusiness: string;
  selectedPackage: string;
  budget: string;
  timeline: string;
  pageCount: string;
  hasExistingSite: string;
  primaryGoal: string;
  mustHaveFeatures: string[];
  competitors: string;
  brandColors: string;
  inspirationSites: string;
  projectDescription: string;
  howDidYouHear: string;
  socialMedia: string;
  additionalNotes: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  businessName: "",
  businessType: "",
  businessAddress: "",
  website: "",
  employeeCount: "",
  yearsInBusiness: "",
  selectedPackage: "",
  budget: "",
  timeline: "",
  pageCount: "",
  hasExistingSite: "",
  primaryGoal: "",
  mustHaveFeatures: [],
  competitors: "",
  brandColors: "",
  inspirationSites: "",
  projectDescription: "",
  howDidYouHear: "",
  socialMedia: "",
  additionalNotes: "",
};

export default function GetStarted() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  const validation = useFormValidation();
  const { loadDraft, clearDraft, hasDraft, lastSaved } = useAutosave(formData as unknown as Record<string, unknown>, step);

  // Check for draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.formData && Object.keys(draft.formData).some(k => draft.formData[k])) {
      setShowDraftDialog(true);
    }
  }, []);

  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData as unknown as FormData);
      setStep(draft.currentStep || 1);
    }
    setShowDraftDialog(false);
  };

  const discardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const stepValidationRules: Record<number, Record<string, { required?: boolean; minLength?: number; maxLength?: number; email?: boolean; phone?: boolean }>> = {
    1: {
      firstName: { required: true, minLength: 2, maxLength: 50 },
      lastName: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, email: true },
      phone: { phone: true },
    },
    2: {
      businessName: { required: true, minLength: 2, maxLength: 100 },
      businessType: { required: true },
    },
    3: {
      selectedPackage: { required: true },
    },
    4: {
      primaryGoal: { required: true },
    },
    5: {
      projectDescription: { required: true, minLength: 20, maxLength: 5000 },
    },
  };

  const handleBlur = (name: string) => {
    validation.setFieldTouched(name);
    // Find the rules for this field across all steps
    for (const stepRules of Object.values(stepValidationRules)) {
      if (stepRules[name]) {
        const value = String((formData as unknown as Record<string, unknown>)[name] || '');
        const error = validation.validateField(name, value, stepRules[name]);
        if (error) {
          validation.setFieldError(name, error);
        } else {
          validation.clearFieldError(name);
        }
        break;
      }
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      mustHaveFeatures: prev.mustHaveFeatures.includes(feature)
        ? prev.mustHaveFeatures.filter(f => f !== feature)
        : [...prev.mustHaveFeatures, feature]
    }));
  };

  const nextStep = () => {
    if (validation.validateStep(step, formData as unknown as Record<string, unknown>)) {
      if (step < TOTAL_STEPS) {
        setDirection(1);
        setStep(prev => prev + 1);
      }
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();
      case 2:
        return formData.businessName.trim() && formData.businessType;
      case 3:
        return formData.selectedPackage;
      case 4:
        return formData.primaryGoal;
      case 5:
        // Only require project description with minimum 20 chars for final submission
        return formData.projectDescription.trim().length >= 20;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validation.validateStep(step, formData as unknown as Record<string, unknown>)) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('enquiries')
        .insert({
          name: `${formData.firstName} ${formData.lastName}`,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.businessName || null,
          business_type: formData.businessType || null,
          business_address: formData.businessAddress || null,
          website: formData.website || null,
          employee_count: formData.employeeCount || null,
          years_in_business: formData.yearsInBusiness || null,
          interest: formData.selectedPackage,
          selected_package: formData.selectedPackage || null,
          budget: formData.budget || null,
          timeline: formData.timeline || null,
          page_count: formData.pageCount || null,
          has_existing_site: formData.hasExistingSite || null,
          primary_goal: formData.primaryGoal || null,
          must_have_features: formData.mustHaveFeatures.length > 0 ? formData.mustHaveFeatures : null,
          competitors: formData.competitors || null,
          brand_colors: formData.brandColors || null,
          inspiration_sites: formData.inspirationSites || null,
          how_did_you_hear: formData.howDidYouHear || null,
          social_media: formData.socialMedia || null,
          additional_notes: formData.additionalNotes || null,
          project_details: formData.projectDescription || null,
          is_draft: false,
          status: 'new',
        });

      if (error) {
        console.error('Error submitting enquiry:', error);
        toast.error('Failed to submit enquiry. Please try again.');
      } else {
        clearDraft();
        setSubmitted(true);
        toast.success('Enquiry submitted successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    { title: "About You", subtitle: "Let's get to know you", icon: User },
    { title: "Your Business", subtitle: "Tell us about your company", icon: Building2 },
    { title: "Your Project", subtitle: "What are you looking for?", icon: Globe },
    { title: "Goals & Vision", subtitle: "What do you want to achieve?", icon: Target },
    { title: "Final Details", subtitle: "You're almost there — just a few more details!", icon: Rocket },
  ];

  const CurrentIcon = stepTitles[step - 1].icon;

  const getFieldClasses = (fieldName: string, baseClasses: string = "") => {
    const error = validation.getFieldError(fieldName);
    const isValid = validation.isFieldValid(fieldName);
    
    if (error) {
      return `${baseClasses} border-destructive focus-visible:ring-destructive`;
    }
    if (isValid) {
      return `${baseClasses} border-green-500/50 focus-visible:ring-green-500`;
    }
    return baseClasses;
  };

  const FieldError = ({ name }: { name: string }) => {
    const error = validation.getFieldError(name);
    if (!error) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="flex items-center gap-1.5 mt-1.5 text-destructive text-sm"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </motion.div>
    );
  };

  const FieldSuccess = ({ name }: { name: string }) => {
    const isValid = validation.isFieldValid(name);
    if (!isValid) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
      >
        <CheckCircle2 className="w-5 h-5" />
      </motion.div>
    );
  };

  return (
    <Layout>
      {/* Draft Restore Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Resume Your Application?
            </DialogTitle>
            <DialogDescription>
              We found a saved draft from your previous session. Would you like to continue where you left off?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button variant="outline" onClick={discardDraft}>
              Start Fresh
            </Button>
            <Button onClick={restoreDraft}>
              Resume Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="min-h-screen pt-24 pb-16 relative overflow-hidden">
        {/* Background Visual */}
        <div className="absolute top-0 right-0 w-2/3 h-[60vh] opacity-15 pointer-events-none">
          <img 
            src={heroWorkspace} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="container-tight max-w-3xl relative">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="p-12 md:p-16 rounded-3xl bg-gradient-card border border-primary/30 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-8"
              >
                <Check className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Thank You, {formData.firstName}!
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                We've received your enquiry and will be in touch within 24 hours to discuss your project.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
                <Mail className="w-4 h-4" />
                Check your inbox for a confirmation email
              </div>
            </motion.div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  {stepTitles.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center ${i < stepTitles.length - 1 ? "flex-1" : ""}`}
                    >
                      <motion.div
                        animate={{
                          scale: step === i + 1 ? 1.1 : 1,
                          backgroundColor: step > i ? "hsl(var(--primary))" : step === i + 1 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                        }}
                        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                          step > i ? "text-primary-foreground" : step === i + 1 ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step > i + 1 ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{i + 1}</span>
                        )}
                      </motion.div>
                      {i < stepTitles.length - 1 && (
                        <div className="flex-1 h-1 mx-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: step > i + 1 ? "100%" : "0%" }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Step {step} of {TOTAL_STEPS}
                  </p>
                  {lastSaved && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Draft saved
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Step Header */}
              <motion.div
                key={`header-${step}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <CurrentIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  {stepTitles[step - 1].title}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {stepTitles[step - 1].subtitle}
                </p>
              </motion.div>

              {/* Form Steps */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10 rounded-3xl bg-card border border-border"
                  >
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">First Name *</label>
                            <div className="relative">
                              <Input
                                name="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                onBlur={() => handleBlur("firstName")}
                                className={getFieldClasses("firstName", "h-12 text-base pr-12")}
                              />
                              <FieldSuccess name="firstName" />
                            </div>
                            <AnimatePresence>
                              <FieldError name="firstName" />
                            </AnimatePresence>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Last Name *</label>
                            <div className="relative">
                              <Input
                                name="lastName"
                                placeholder="Smith"
                                value={formData.lastName}
                                onChange={handleChange}
                                onBlur={() => handleBlur("lastName")}
                                className={getFieldClasses("lastName", "h-12 text-base pr-12")}
                              />
                              <FieldSuccess name="lastName" />
                            </div>
                            <AnimatePresence>
                              <FieldError name="lastName" />
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="email"
                              type="email"
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={handleChange}
                              onBlur={() => handleBlur("email")}
                              className={getFieldClasses("email", "h-12 text-base pl-12 pr-12")}
                            />
                            <FieldSuccess name="email" />
                          </div>
                          <AnimatePresence>
                            <FieldError name="email" />
                          </AnimatePresence>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="phone"
                              type="tel"
                              placeholder="+44 7123 456789"
                              value={formData.phone}
                              onChange={handleChange}
                              onBlur={() => handleBlur("phone")}
                              className={getFieldClasses("phone", "h-12 text-base pl-12 pr-12")}
                            />
                            <FieldSuccess name="phone" />
                          </div>
                          <AnimatePresence>
                            <FieldError name="phone" />
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Business Info */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Business Name *</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="businessName"
                              placeholder="Your Business Ltd"
                              value={formData.businessName}
                              onChange={handleChange}
                              onBlur={() => handleBlur("businessName")}
                              className={getFieldClasses("businessName", "h-12 text-base pl-12 pr-12")}
                            />
                            <FieldSuccess name="businessName" />
                          </div>
                          <AnimatePresence>
                            <FieldError name="businessName" />
                          </AnimatePresence>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-3">Business Type *</label>
                          <div className="grid grid-cols-2 gap-3">
                            {businessTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, businessType: type }));
                                  validation.setFieldTouched("businessType");
                                }}
                                className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
                                  formData.businessType === type
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                          <AnimatePresence>
                            <FieldError name="businessType" />
                          </AnimatePresence>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Business Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="businessAddress"
                              placeholder="123 High Street, London"
                              value={formData.businessAddress}
                              onChange={handleChange}
                              className="h-12 text-base pl-12"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">Current Website</label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                name="website"
                                placeholder="www.example.com"
                                value={formData.website}
                                onChange={handleChange}
                                className="h-12 text-base pl-12"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Years in Business</label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                name="yearsInBusiness"
                                placeholder="e.g. 5 years"
                                value={formData.yearsInBusiness}
                                onChange={handleChange}
                                className="h-12 text-base pl-12"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Number of Employees</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="employeeCount"
                              placeholder="e.g. 1-5, 10-20, 50+"
                              value={formData.employeeCount}
                              onChange={handleChange}
                              className="h-12 text-base pl-12"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Project Requirements */}
                    {step === 3 && (
                      <div className="space-y-8">
                        <div>
                          <label className="block text-sm font-medium mb-3">Which package interests you? *</label>
                          <div className="space-y-3">
                            {packages.map((pkg) => (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, selectedPackage: pkg.name }));
                                  validation.setFieldTouched("selectedPackage");
                                }}
                                className={`w-full p-4 rounded-2xl text-left transition-all border ${
                                  formData.selectedPackage === pkg.name
                                    ? "bg-primary/10 border-primary"
                                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold">{pkg.name}</div>
                                    <div className="text-sm text-muted-foreground">{pkg.desc}</div>
                                  </div>
                                  <div className={`text-sm font-bold ${formData.selectedPackage === pkg.name ? "text-primary" : "text-muted-foreground"}`}>
                                    {pkg.price}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          <AnimatePresence>
                            <FieldError name="selectedPackage" />
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">What's your budget?</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {budgetRanges.map((budget) => (
                              <button
                                key={budget}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, budget }))}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                                  formData.budget === budget
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {budget}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">When do you need it?</label>
                          <div className="space-y-2">
                            {timelines.map((timeline) => (
                              <button
                                key={timeline}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, timeline }))}
                                className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all ${
                                  formData.timeline === timeline
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {timeline}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">Do you have an existing website?</label>
                          <div className="grid grid-cols-3 gap-3">
                            {["Yes, needs redesign", "Yes, keep some parts", "No, starting fresh"].map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hasExistingSite: option }))}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                                  formData.hasExistingSite === option
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Goals & Features */}
                    {step === 4 && (
                      <div className="space-y-8">
                        <div>
                          <label className="block text-sm font-medium mb-3">What's your primary goal? *</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              "Get more enquiries/leads",
                              "Sell products online",
                              "Build brand credibility",
                              "Showcase portfolio/work",
                              "Provide information",
                              "Book appointments",
                              "Generate phone calls",
                              "Other",
                            ].map((goal) => (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, primaryGoal: goal }));
                                  validation.setFieldTouched("primaryGoal");
                                }}
                                className={`p-4 rounded-xl text-sm font-medium text-left transition-all ${
                                  formData.primaryGoal === goal
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {goal}
                              </button>
                            ))}
                          </div>
                          <AnimatePresence>
                            <FieldError name="primaryGoal" />
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">Must-have features (select all that apply)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              "Contact Form",
                              "Google Maps",
                              "Photo Gallery",
                              "Testimonials",
                              "Blog",
                              "Online Booking",
                              "E-commerce",
                              "Live Chat",
                              "Social Feeds",
                              "Video",
                              "Newsletter Signup",
                              "Multi-language",
                            ].map((feature) => (
                              <button
                                key={feature}
                                type="button"
                                onClick={() => handleFeatureToggle(feature)}
                                className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                                  formData.mustHaveFeatures.includes(feature)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {formData.mustHaveFeatures.includes(feature) && <Check className="w-4 h-4" />}
                                {feature}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Any competitor websites you like?</label>
                          <Textarea
                            name="competitors"
                            placeholder="Share URLs of websites you admire or want to compete with..."
                            value={formData.competitors}
                            onChange={handleChange}
                            rows={3}
                            className="text-base"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">Brand Colours</label>
                            <div className="relative">
                              <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                name="brandColors"
                                placeholder="e.g. Blue and white"
                                value={formData.brandColors}
                                onChange={handleChange}
                                className="h-12 text-base pl-12"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Inspiration Sites</label>
                            <Input
                              name="inspirationSites"
                              placeholder="URLs of sites you love"
                              value={formData.inspirationSites}
                              onChange={handleChange}
                              className="h-12 text-base"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Final Details */}
                    {step === 5 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Tell us about your project *</label>
                          <Textarea
                            name="projectDescription"
                            placeholder="Describe your vision, what you want to achieve, any specific requirements or ideas you have... (minimum 20 characters)"
                            value={formData.projectDescription}
                            onChange={handleChange}
                            onBlur={() => handleBlur("projectDescription")}
                            rows={5}
                            className={getFieldClasses("projectDescription", "text-base")}
                          />
                          <div className="flex items-center justify-between mt-1">
                            <AnimatePresence>
                              <FieldError name="projectDescription" />
                            </AnimatePresence>
                            <span className={`text-xs ${formData.projectDescription.length < 20 ? 'text-muted-foreground' : 'text-green-500'}`}>
                              {formData.projectDescription.length}/20 min
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">How did you hear about us?</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {howDidYouHear.map((source) => (
                              <button
                                key={source}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, howDidYouHear: source }))}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                                  formData.howDidYouHear === source
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                }`}
                              >
                                {source}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Your Social Media Handles</label>
                          <div className="relative">
                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              name="socialMedia"
                              placeholder="@yourbusiness (Instagram, Facebook, etc.)"
                              value={formData.socialMedia}
                              onChange={handleChange}
                              className="h-12 text-base pl-12"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Anything else we should know?</label>
                          <Textarea
                            name="additionalNotes"
                            placeholder="Any additional information, questions, or special requirements..."
                            value={formData.additionalNotes}
                            onChange={handleChange}
                            rows={3}
                            className="text-base"
                          />
                        </div>

                        {/* Summary Preview */}
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Quick Summary
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Name:</span>
                              <span className="ml-2 font-medium">{formData.firstName} {formData.lastName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Business:</span>
                              <span className="ml-2 font-medium">{formData.businessName}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Package:</span>
                              <span className="ml-2 font-medium">{formData.selectedPackage}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Budget:</span>
                              <span className="ml-2 font-medium">{formData.budget || "Not specified"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    variant="premium"
                    size="lg"
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="premium"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading || !canProceed()}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Enquiry
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
