import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Building2, Mail, User, Phone, FileText, Calendar, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface CustomQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageType?: string;
}

const quoteSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional(),
  phone: z.string().trim().max(20, "Phone number must be less than 20 characters").optional(),
  projectType: z.string().min(1, "Please select a project type"),
  budgetRange: z.string().min(1, "Please select a budget range"),
  timeline: z.string().min(1, "Please select a timeline"),
  description: z.string().trim().min(20, "Please provide at least 20 characters describing your project").max(2000, "Description must be less than 2000 characters"),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const projectTypes = [
  { value: "website", label: "Professional Website" },
  { value: "webapp", label: "Web Application" },
  { value: "dashboard", label: "Business Dashboard" },
  { value: "ecommerce", label: "E-Commerce Platform" },
  { value: "inventory", label: "Inventory System" },
  { value: "crm", label: "CRM / Booking System" },
  { value: "custom", label: "Custom Solution" },
  { value: "multiple", label: "Multiple Projects" },
];

const budgetRanges = [
  { value: "under-5k", label: "Under £5,000" },
  { value: "5k-10k", label: "£5,000 - £10,000" },
  { value: "10k-25k", label: "£10,000 - £25,000" },
  { value: "25k-50k", label: "£25,000 - £50,000" },
  { value: "50k-100k", label: "£50,000 - £100,000" },
  { value: "over-100k", label: "Over £100,000" },
  { value: "discuss", label: "Prefer to Discuss" },
];

const timelines = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-month", label: "Within 1 month" },
  { value: "1-3-months", label: "1-3 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "6-months-plus", label: "6+ months" },
  { value: "flexible", label: "Flexible" },
];

export function CustomQuoteModal({ isOpen, onClose, packageType = "Enterprise" }: CustomQuoteModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteFormData, string>>>({});
  
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    projectType: "",
    budgetRange: "",
    timeline: "",
    description: "",
  });

  const handleInputChange = (field: keyof QuoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = quoteSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof QuoteFormData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof QuoteFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to enquiries table
      const { error } = await supabase.from("enquiries").insert({
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        phone: formData.phone || null,
        interest: formData.projectType,
        budget: formData.budgetRange,
        timeline: formData.timeline,
        project_details: formData.description,
        selected_package: packageType,
        status: "new",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Quote Request Submitted",
        description: "We'll be in touch within 24 hours with a tailored proposal.",
      });

      // Reset and close after delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          company: "",
          phone: "",
          projectType: "",
          budgetRange: "",
          timeline: "",
          description: "",
        });
        onClose();
      }, 3000);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full max-h-[90vh] overflow-y-auto z-50 rounded-2xl liquid-glass-card border border-border/50 shadow-2xl"
          >
            {isSubmitted ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="font-display font-bold text-2xl mb-3">Quote Request Received!</h3>
                <p className="text-muted-foreground mb-2">
                  Thank you for your interest in our {packageType} solutions.
                </p>
                <p className="text-sm text-muted-foreground">
                  Our team will review your requirements and get back to you within 24 hours with a tailored proposal.
                </p>
              </motion.div>
            ) : (
              /* Form State */
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl mb-1">
                      Request Custom Quote
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your project and we'll create a tailored proposal.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-full -mt-1 -mr-1"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Email Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="John Smith"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@company.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Company & Phone Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        Company Name
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Your Company Ltd"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+44 123 456 7890"
                      />
                    </div>
                  </div>

                  {/* Project Type */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Project Type *
                    </Label>
                    <Select
                      value={formData.projectType}
                      onValueChange={(value) => handleInputChange("projectType", value)}
                    >
                      <SelectTrigger className={errors.projectType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.projectType && <p className="text-xs text-destructive">{errors.projectType}</p>}
                  </div>

                  {/* Budget & Timeline Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        Budget Range *
                      </Label>
                      <Select
                        value={formData.budgetRange}
                        onValueChange={(value) => handleInputChange("budgetRange", value)}
                      >
                        <SelectTrigger className={errors.budgetRange ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.budgetRange && <p className="text-xs text-destructive">{errors.budgetRange}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Timeline *
                      </Label>
                      <Select
                        value={formData.timeline}
                        onValueChange={(value) => handleInputChange("timeline", value)}
                      >
                        <SelectTrigger className={errors.timeline ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelines.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.timeline && <p className="text-xs text-destructive">{errors.timeline}</p>}
                    </div>
                  </div>

                  {/* Project Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Project Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Tell us about your project requirements, goals, and any specific features you need..."
                      rows={4}
                      className={errors.description ? "border-destructive" : ""}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Quote Request
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We'll respond within 24 hours with a tailored proposal. No commitment required.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
