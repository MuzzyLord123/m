import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Heart, ArrowRight, Share2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ParallaxBackground } from "@/components/ParallaxImage";
import { PricingCard3D } from "@/components/Card3D";
import socialMedia from "@/assets/social-media.jpg";

const packages = [
  { 
    name: "Starter", 
    price: "Tailored", 
    period: "", 
    features: [
      "2 platforms", 
      "8 posts monthly", 
      "Basic engagement", 
      "Monthly reporting"
    ] 
  },
  { 
    name: "Growth", 
    price: "Tailored", 
    period: "", 
    features: [
      "3 platforms", 
      "16 posts monthly", 
      "Community management", 
      "Ad spend management"
    ], 
    popular: true 
  },
  { 
    name: "Professional", 
    price: "Tailored", 
    period: "", 
    features: [
      "5 platforms", 
      "30 posts monthly", 
      "Full ad management", 
      "Influencer outreach"
    ] 
  },
  { 
    name: "Enterprise", 
    price: "Custom", 
    period: "", 
    features: [
      "All platforms", 
      "Unlimited posts", 
      "Complete management", 
      "Tailored to you"
    ],
    isEnterprise: true
  },
];

export default function SocialMedia() {
  return (
    <Layout>
      {/* Hero with Parallax */}
      <section className="section-padding pt-32 relative overflow-hidden">
        <ParallaxBackground
          src={socialMedia}
          alt="Social media content grid"
          parallaxSpeed={0.2}
          overlayClassName="bg-gradient-to-b from-background via-background/85 to-background"
        />
        <div className="container-tight relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center max-w-3xl mx-auto mb-8"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Share2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Social Media</span>
            </motion.div>
            <motion.h1 
              className="heading-xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Social Media <span className="text-gradient">Management</span>
            </motion.h1>
            <motion.p 
              className="body-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Complete platform management across Meta, Facebook, Instagram, TikTok, LinkedIn, Twitter, YouTube, and Pinterest.
            </motion.p>
          </motion.div>

          {/* Trust Signals */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 mb-16 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Heart className="w-4 h-4 text-primary" />
              <span>UK-based support</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, i) => (
              <motion.div 
                key={pkg.name} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                viewport={{ once: true }} 
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <PricingCard3D
                  isPopular={pkg.popular}
                  isEnterprise={pkg.isEnterprise}
                  className="h-full"
                >
                  <div className="flex flex-col h-full">
                    {pkg.popular && (
                      <div className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4 w-fit whitespace-nowrap">
                        Most Popular
                      </div>
                    )}
                    <h3 className="font-display font-bold text-xl mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className={`text-3xl font-bold ${pkg.isEnterprise ? "text-muted-foreground" : "text-gradient"}`}>
                        {pkg.price}
                      </span>
                      <span className="text-muted-foreground">{pkg.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6 flex-1">
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant={pkg.popular ? "premium" : "glass"} 
                      className="w-full mt-auto" 
                      asChild
                    >
                      <Link to="/get-started">
                        {pkg.isEnterprise ? "Contact Us" : "Get Started"}
                      </Link>
                    </Button>
                  </div>
                </PricingCard3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h2 className="heading-md mb-4">
              Bundle with Your <span className="text-gradient">Website</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Combine any website package with social media management and receive 15% off the total monthly fee.
            </p>
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Custom Quote <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}