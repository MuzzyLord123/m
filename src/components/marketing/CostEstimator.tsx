import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ArrowRight, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: { label: string; value: string; priceMin: number; priceMax: number }[];
}

const questions: Question[] = [
  {
    id: "type",
    question: "What type of project do you need?",
    options: [
      { label: "Marketing Website", value: "website", priceMin: 500, priceMax: 1500 },
      { label: "E-Commerce / Booking Site", value: "ecommerce", priceMin: 1500, priceMax: 4000 },
      { label: "App or Dashboard", value: "app", priceMin: 2000, priceMax: 8000 },
      { label: "Complex Platform", value: "platform", priceMin: 5000, priceMax: 15000 },
    ],
  },
  {
    id: "pages",
    question: "How many pages or screens?",
    options: [
      { label: "1–5 pages", value: "small", priceMin: 0, priceMax: 0 },
      { label: "6–15 pages", value: "medium", priceMin: 300, priceMax: 800 },
      { label: "16–30 pages", value: "large", priceMin: 800, priceMax: 2000 },
      { label: "30+ pages", value: "xlarge", priceMin: 1500, priceMax: 4000 },
    ],
  },
  {
    id: "features",
    question: "Do you need any of these?",
    options: [
      { label: "Basic — just the site", value: "basic", priceMin: 0, priceMax: 0 },
      { label: "CMS / Blog", value: "cms", priceMin: 200, priceMax: 600 },
      { label: "User Accounts / Login", value: "auth", priceMin: 400, priceMax: 1000 },
      { label: "Integrations (APIs, payments)", value: "integrations", priceMin: 500, priceMax: 2000 },
    ],
  },
  {
    id: "timeline",
    question: "When do you need it?",
    options: [
      { label: "No rush — flexible", value: "flexible", priceMin: 0, priceMax: 0 },
      { label: "Within 4–6 weeks", value: "normal", priceMin: 0, priceMax: 200 },
      { label: "Within 2–3 weeks", value: "fast", priceMin: 200, priceMax: 500 },
      { label: "ASAP — urgent", value: "urgent", priceMin: 500, priceMax: 1500 },
    ],
  },
];

export function CostEstimator() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const currentQ = questions[step];

  const selectOption = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const getEstimate = () => {
    let min = 0;
    let max = 0;
    for (const q of questions) {
      const selected = answers[q.id];
      const opt = q.options.find((o) => o.value === selected);
      if (opt) {
        min += opt.priceMin;
        max += opt.priceMax;
      }
    }
    // Round to nearest 100
    min = Math.round(min / 100) * 100;
    max = Math.round(max / 100) * 100;
    return { min: Math.max(min, 500), max: Math.max(max, 1000) };
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(answers).forEach(([k, v]) => params.set(k, v));
    const est = getEstimate();
    params.set("estimate", `${est.min}-${est.max}`);
    return params.toString();
  };

  return (
    <section className="section-padding">
      <div className="container-tight">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="heading-lg mb-3">
              Instant Cost <span className="text-gradient">Estimator</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Answer 4 quick questions to get a ballpark price range — no commitment
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="liquid-glass-card p-6 sm:p-8"
          >
            {!showResult ? (
              <>
                {/* Progress */}
                <div className="flex items-center gap-2 mb-6">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        i <= step ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  Question {step + 1} of {questions.length}
                </p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="text-lg sm:text-xl font-bold mb-5">{currentQ.question}</h3>
                    <div className="space-y-2">
                      {currentQ.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => selectOption(opt.value)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border transition-all",
                            "hover:border-primary/50 hover:bg-primary/5",
                            answers[currentQ.id] === opt.value
                              ? "border-primary bg-primary/10"
                              : "border-border/50"
                          )}
                        >
                          <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                  Estimated Range
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                  £{getEstimate().min.toLocaleString()} — £{getEstimate().max.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                  This is a rough estimate. Your exact quote depends on specific requirements and scope.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="hero" asChild>
                    <Link to={`/get-started?${buildQueryString()}`}>
                      Get Exact Quote <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Start Over
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
