import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, X, Zap, Clock, Shield, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const comparisons = [
  { feature: "Transparent Pricing", us: true, agency: false },
  { feature: "Delivery Time", us: "1-2 weeks", agency: "4-8 weeks" },
  { feature: "Code Ownership", us: true, agency: false },
  { feature: "Vendor Lock-in", us: false, agency: true },
  { feature: "Hidden Fees", us: false, agency: true },
  { feature: "Direct Communication", us: true, agency: false },
  { feature: "Post-Launch Support", us: "Included", agency: "Extra cost" },
];

export default function Comparison() {
  return (
    <Layout>
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mb-16">
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">Why <span className="text-gradient">Choose Us?</span></h1>
            <p className="body-lg">30% more affordable than typical agencies with faster delivery and complete ownership.</p>
          </motion.div>
          
          <div className="max-w-4xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4">Feature</th>
                  <th className="p-4 bg-primary/10"><span className="text-primary font-display">Quooro</span></th>
                  <th className="p-4">Typical Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4 text-muted-foreground">{row.feature}</td>
                    <td className="p-4 bg-primary/5">
                      {typeof row.us === "boolean" ? (row.us ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-destructive mx-auto" />) : <span className="font-semibold text-primary">{row.us}</span>}
                    </td>
                    <td className="p-4">
                      {typeof row.agency === "boolean" ? (row.agency ? <Check className="w-5 h-5 text-primary mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />) : <span className="text-muted-foreground">{row.agency}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: Zap, title: "More Affordable", desc: "Premium quality at competitive rates tailored to you" },
              { icon: Clock, title: "Faster Delivery", desc: "Starter sites in days, full projects in weeks not months" },
              { icon: Shield, title: "Complete Ownership", desc: "Your code, your design, no strings attached" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="p-6 rounded-2xl border border-border/50 bg-card group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10"><item.icon className="w-7 h-7 text-primary" /></div>
                <h3 className="font-display font-bold text-lg mb-2 relative z-10">{item.title}</h3>
                <p className="text-sm text-muted-foreground relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16"><Button variant="premium" size="xl" asChild><Link to="/get-started">Get Started Today <ArrowRight className="w-4 h-4" /></Link></Button></div>
        </div>
      </section>
    </Layout>
  );
}
