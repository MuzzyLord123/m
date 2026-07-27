import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const faqItems = [
  {
    category: "Pricing & Payment",
    q: "How is pricing determined for each package?",
    a: "Every project is unique. After our discovery call, we provide a detailed proposal with transparent pricing based on your specific requirements, timeline, and complexity. No hidden fees, ever.",
  },
  {
    category: "Ownership",
    q: "Do I own the code and intellectual property?",
    a: "Absolutely. You receive 100% ownership of all code, designs, and assets. We can transfer via GitHub or encrypted file handover — you choose what works best for you.",
  },
  {
    category: "Pricing & Payment",
    q: "What if my needs don't fit a standard package?",
    a: "Most projects are customized to some degree. Our packages are starting points — we'll tailor the scope to match your exact requirements during the discovery phase.",
  },
  {
    category: "Support",
    q: "Do you offer ongoing support and maintenance?",
    a: "Yes. Every project includes post-launch support. We also offer ongoing maintenance plans, retainer arrangements, and development partnerships for continued growth.",
  },
  {
    category: "Process",
    q: "How do you handle project communication?",
    a: "You'll have direct access to our team through your preferred channels. Regular updates, milestone reviews, and collaborative feedback sessions keep you informed throughout.",
  },
  {
    category: "Technical",
    q: "Can you integrate with our existing systems?",
    a: "Definitely. We specialize in integrations — CRMs, ERPs, payment gateways, shipping providers, and custom APIs. We'll assess integration requirements during discovery.",
  },
  {
    category: "Process",
    q: "What happens during the discovery phase?",
    a: "We learn about your business goals, target audience, technical requirements, and timeline. This helps us create a detailed project plan and accurate proposal.",
  },
  {
    category: "Technical",
    q: "What technologies do you use?",
    a: "We use modern, scalable technologies including React, TypeScript, Node.js, and cloud platforms. Our stack is chosen based on your project's specific needs.",
  },
];

export function EnhancedFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search frequently asked questions"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No questions found matching your search.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-all duration-300",
                  isOpen 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-border/50 hover:border-primary/20"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 md:p-6 flex items-start justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1 pr-4">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider mb-1 block">
                      {item.category}
                    </span>
                    <h3 className="font-display font-semibold text-base md:text-lg">
                      {item.q}
                    </h3>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} 
                  />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 md:px-6 pb-4 md:pb-6">
                        <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-prose">
                          {item.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
