import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { EnquiryBrandPanel } from "@/components/marketing/EnquiryBrandPanel";
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
      return `${baseClasses} border-[hsl(var(--success))]/50 focus-visible:ring-[hsl(var(--success))]`;
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
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--success))]"
      >
        <CheckCircle2 className="w-5 h-5" />
      </motion.div>
    );
  };

  // Elite field + label recipe — presentation only, shared with the auth pages.
  const F = "h-11 rounded-xl border-border/60 bg-foreground/[0.03] text-[15px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]";
  const L = "mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const chipOn = "border-primary bg-primary text-primary-foreground";
  const chipOff = "border-border/60 text-foreground hover:border-primary/50";

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
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

      {/* Brand panel — the live intake ledger. Hidden below lg. */}
      <EnquiryBrandPanel step={step} steps={stepTitles} submitted={submitted} />

      {/* Form column */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex min-h-screen flex-col lg:h-screen"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-8 lg:min-h-0 lg:py-5">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to website
            </Link>
            <span className="mono-label lg:hidden">Free preview first</span>
          </div>

          {submitted ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8 flex h-16 w-16 items-center justify-center border border-primary bg-primary"
              >
                <Check className="h-8 w-8 text-primary-foreground" strokeWidth={2.2} />
              </motion.div>
              <h2 className="mb-3 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Thank you, {formData.firstName}.
              </h2>
              <p className="mb-7 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                We've received your enquiry and will be in touch within 24 hours to discuss your project.
              </p>
              <div className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                <Mail className="w-4 h-4" />
                Check your inbox for a confirmation email
              </div>
              <Button variant="outline" asChild>
                <Link to="/">Return to website</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile progress rail — the left ledger covers this on lg */}
              <div className="mb-4 lg:hidden" aria-hidden>
                <div className="flex items-center gap-2">
                  {stepTitles.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center ${i < stepTitles.length - 1 ? "flex-1" : ""}`}
                    >
                      <motion.div
                        animate={{
                          backgroundColor: step > i ? "hsl(var(--primary))" : "transparent",
                          borderColor: step > i ? "hsl(var(--primary))" : "hsl(var(--border))",
                        }}
                        className={`relative flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                          step > i ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step > i + 1 ? (
                          <Check className="h-3 w-3" strokeWidth={2.4} />
                        ) : (
                          <span className="font-mono text-[10px] tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                      </motion.div>
                      {i < stepTitles.length - 1 && (
                        <div className="mx-1.5 h-px flex-1 overflow-hidden bg-border">
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
              </div>

              {/* Step header */}
              <motion.div
                key={`header-${step}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] tabular-nums text-primary">
                      {String(step).padStart(2, "0")}
                    </span>
                    <span className="h-px w-8 bg-primary" />
                    <CurrentIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Step {step} of {TOTAL_STEPS}
                  </span>
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl lg:text-2xl xl:text-3xl">
                  {stepTitles[step - 1].title}
                </h1>
                <p className="mt-1 text-sm font-light text-muted-foreground">
                  {stepTitles[step - 1].subtitle}
                </p>
              </motion.div>

              {/* Step content — fills the column; scrolls inside itself if a
                  short laptop viewport ever needs it, so the page never does */}
              <div className="relative -mr-2 mt-3 flex-1 overflow-x-hidden pr-2 lg:min-h-0 lg:overflow-y-auto">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="pb-2"
                  >
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label className={L}>First name</label>
                            <div className="relative">
                              <Input
                                name="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                onBlur={() => handleBlur("firstName")}
                                className={getFieldClasses("firstName", `${F} pr-10`)}
                              />
                              <FieldSuccess name="firstName" />
                            </div>
                            <AnimatePresence>
                              <FieldError name="firstName" />
                            </AnimatePresence>
                          </div>
                          <div>
                            <label className={L}>Last name</label>
                            <div className="relative">
                              <Input
                                name="lastName"
                                placeholder="Smith"
                                value={formData.lastName}
                                onChange={handleChange}
                                onBlur={() => handleBlur("lastName")}
                                className={getFieldClasses("lastName", `${F} pr-10`)}
                              />
                              <FieldSuccess name="lastName" />
                            </div>
                            <AnimatePresence>
                              <FieldError name="lastName" />
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className={L}>Email address</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              name="email"
                              type="email"
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={handleChange}
                              onBlur={() => handleBlur("email")}
                              className={getFieldClasses("email", `${F} pl-10 pr-10`)}
                            />
                            <FieldSuccess name="email" />
                          </div>
                          <AnimatePresence>
                            <FieldError name="email" />
                          </AnimatePresence>
                        </div>
                        <div>
                          <label className={L}>Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              name="phone"
                              type="tel"
                              placeholder="+44 7123 456789"
                              value={formData.phone}
                              onChange={handleChange}
                              onBlur={() => handleBlur("phone")}
                              className={getFieldClasses("phone", `${F} pl-10 pr-10`)}
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
                      <div className="space-y-4">
                        <div>
                          <label className={L}>Business name</label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              name="businessName"
                              placeholder="Your Business Ltd"
                              value={formData.businessName}
                              onChange={handleChange}
                              onBlur={() => handleBlur("businessName")}
                              className={getFieldClasses("businessName", `${F} pl-10 pr-10`)}
                            />
                            <FieldSuccess name="businessName" />
                          </div>
                          <AnimatePresence>
                            <FieldError name="businessName" />
                          </AnimatePresence>
                        </div>
                        <div>
                          <label className={L}>Business type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {businessTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, businessType: type }));
                                  validation.setFieldTouched("businessType");
                                }}
                                className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                                  formData.businessType === type ? chipOn : chipOff
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
                          <label className={L}>Business address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              name="businessAddress"
                              placeholder="123 High Street, London"
                              value={formData.businessAddress}
                              onChange={handleChange}
                              className={`${F} pl-10`}
                            />
                          </div>
                        </div>
                        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label className={L}>Current website</label>
                            <div className="relative">
                              <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                name="website"
                                placeholder="www.example.com"
                                value={formData.website}
                                onChange={handleChange}
                                className={`${F} pl-10`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={L}>Years in business</label>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                name="yearsInBusiness"
                                placeholder="e.g. 5 years"
                                value={formData.yearsInBusiness}
                                onChange={handleChange}
                                className={`${F} pl-10`}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={L}>Number of employees</label>
                          <div className="relative">
                            <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              name="employeeCount"
                              placeholder="e.g. 1-5, 10-20, 50+"
                              value={formData.employeeCount}
                              onChange={handleChange}
                              className={`${F} pl-10`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Project Requirements */}
                    {step === 3 && (
                      <div className="space-y-3">
                        <div>
                          <label className={L}>Which package interests you?</label>
                          <div className="space-y-2">
                            {packages.map((pkg) => (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, selectedPackage: pkg.name }));
                                  validation.setFieldTouched("selectedPackage");
                                }}
                                className={`w-full rounded-lg border px-3.5 py-2 text-left transition-colors ${
                                  formData.selectedPackage === pkg.name
                                    ? "border-primary bg-primary/[0.06]"
                                    : "border-border/60 hover:border-primary/50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold tracking-tight">{pkg.name}</div>
                                    <div className="text-[11px] font-light leading-tight text-muted-foreground">{pkg.desc}</div>
                                  </div>
                                  <div className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] ${formData.selectedPackage === pkg.name ? "text-primary" : "text-muted-foreground"}`}>
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
                          <label className={L}>What's your budget?</label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {budgetRanges.map((budget) => (
                              <button
                                key={budget}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, budget }))}
                                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                                  formData.budget === budget ? chipOn : chipOff
                                }`}
                              >
                                {budget}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={L}>When do you need it?</label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {timelines.map((timeline) => (
                              <button
                                key={timeline}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, timeline }))}
                                className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                                  formData.timeline === timeline ? chipOn : chipOff
                                }`}
                              >
                                {timeline}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={L}>Do you have an existing website?</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Yes, needs redesign", "Yes, keep some parts", "No, starting fresh"].map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hasExistingSite: option }))}
                                className={`rounded-lg border px-2 py-2 text-[12px] font-medium transition-colors ${
                                  formData.hasExistingSite === option ? chipOn : chipOff
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
                      <div className="space-y-4">
                        <div>
                          <label className={L}>What's your primary goal?</label>
                          <div className="grid grid-cols-2 gap-2">
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
                                className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                                  formData.primaryGoal === goal ? chipOn : chipOff
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
                          <label className={L}>Must-have features</label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[12.5px] font-medium transition-colors ${
                                  formData.mustHaveFeatures.includes(feature) ? chipOn : chipOff
                                }`}
                              >
                                {formData.mustHaveFeatures.includes(feature) && <Check className="h-3.5 w-3.5 shrink-0" />}
                                {feature}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={L}>Any competitor websites you like?</label>
                          <Textarea
                            name="competitors"
                            placeholder="Share URLs of websites you admire or want to compete with..."
                            value={formData.competitors}
                            onChange={handleChange}
                            rows={2}
                            className={`${F} h-auto min-h-[64px]`}
                          />
                        </div>

                        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label className={L}>Brand colours</label>
                            <div className="relative">
                              <Palette className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                name="brandColors"
                                placeholder="e.g. Blue and white"
                                value={formData.brandColors}
                                onChange={handleChange}
                                className={`${F} pl-10`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={L}>Inspiration sites</label>
                            <Input
                              name="inspirationSites"
                              placeholder="URLs of sites you love"
                              value={formData.inspirationSites}
                              onChange={handleChange}
                              className={F}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Final Details */}
                    {step === 5 && (
                      <div className="space-y-4">
                        <div>
                          <label className={L}>Tell us about your project</label>
                          <Textarea
                            name="projectDescription"
                            placeholder="Describe your vision, what you want to achieve, any specific requirements or ideas you have... (minimum 20 characters)"
                            value={formData.projectDescription}
                            onChange={handleChange}
                            onBlur={() => handleBlur("projectDescription")}
                            rows={4}
                            className={getFieldClasses("projectDescription", `${F} h-auto min-h-[104px]`)}
                          />
                          <div className="flex items-center justify-between mt-1">
                            <AnimatePresence>
                              <FieldError name="projectDescription" />
                            </AnimatePresence>
                            <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${formData.projectDescription.length < 20 ? 'text-muted-foreground' : 'text-[hsl(var(--success))]'}`}>
                              {formData.projectDescription.length}/20 min
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className={L}>How did you hear about us?</label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {howDidYouHear.map((source) => (
                              <button
                                key={source}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, howDidYouHear: source }))}
                                className={`rounded-lg border px-2.5 py-2 text-[12.5px] font-medium transition-colors ${
                                  formData.howDidYouHear === source ? chipOn : chipOff
                                }`}
                              >
                                {source}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <label className={L}>Social media handles</label>
                            <div className="relative">
                              <Instagram className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                name="socialMedia"
                                placeholder="@yourbusiness"
                                value={formData.socialMedia}
                                onChange={handleChange}
                                className={`${F} pl-10`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={L}>Anything else we should know?</label>
                            <Textarea
                              name="additionalNotes"
                              placeholder="Any additional information or special requirements..."
                              value={formData.additionalNotes}
                              onChange={handleChange}
                              rows={1}
                              className={`${F} h-11 min-h-[44px]`}
                            />
                          </div>
                        </div>

                        {/* Summary Preview — the ledger, in miniature */}
                        <div className="rounded-xl border border-border/60 p-4">
                          <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                            Your enquiry
                          </h4>
                          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                            <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Name</span>
                              <span className="truncate font-medium">{formData.firstName} {formData.lastName}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Business</span>
                              <span className="truncate font-medium">{formData.businessName}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Package</span>
                              <span className="truncate font-medium">{formData.selectedPackage}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-1.5">
                              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Budget</span>
                              <span className="truncate font-medium">{formData.budget || "Not specified"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation — pinned to the column foot */}
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/60 pt-3.5">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`h-11 rounded-xl ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>

                {lastSaved && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:flex"
                  >
                    <Save className="h-3 w-3" />
                    Draft saved
                  </motion.p>
                )}

                {step < TOTAL_STEPS ? (
                  <Button
                    variant="premium"
                    size="lg"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="h-11 rounded-xl"
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
                    className="h-11 rounded-xl"
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
      </motion.div>
    </div>
  );
}
