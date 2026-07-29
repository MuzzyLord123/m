import { motion } from "framer-motion";
import { Shield, Zap, Settings, CheckCircle, AlertTriangle, Server, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function WebsiteManagement() {
  const managementIncludes = [
    "Ongoing website maintenance & monitoring",
    "Bug fixes and error resolution",
    "Performance checks and optimisation",
    "Security updates and dependency updates",
    "Content edits (text changes, layout tweaks, CTA updates)",
    "Image and photo uploads",
    "Menu updates (for static or eCommerce sites)",
    "Ensuring the website runs smoothly at all times"
  ];

  const managementPlans = [
    {
      name: "Starter Management",
      price: "Tailored Pricing",
      period: "per month",
      features: [
        "Small websites & static sites",
        "Minor edits and updates",
        "Bug fixes",
        "Performance monitoring"
      ],
      recommended: false
    },
    {
      name: "Business Management",
      price: "Tailored Pricing",
      period: "per month",
      features: [
        "Growing businesses & service sites",
        "Regular content changes",
        "Image uploads & layout edits",
        "Priority bug fixes",
        "Ongoing maintenance"
      ],
      recommended: true
    },
    {
      name: "eCommerce Management",
      price: "Tailored Pricing",
      period: "per month",
      features: [
        "Product uploads & changes",
        "Menu updates",
        "Pricing changes",
        "Image uploads",
        "Performance & stability monitoring",
        "Recommended for businesses with frequent updates"
      ],
      recommended: false
    }
  ];

  const hostingCosts = [
    { type: "Small / Static Sites", cost: "Based on usage" },
    { type: "Business Sites", cost: "Based on usage" },
    { type: "Larger / High-Traffic Sites", cost: "Based on usage" }
  ];

  return (
    <Layout>
    <div className="min-h-screen bg-background">
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <Badge variant="outline" className="mb-6 px-4 py-2">
              <Settings className="w-4 h-4 mr-2" />
              Optional Service
            </Badge>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Website Management & <span className="text-gradient">Maintenance</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              Our Website Management service ensures your site remains secure, fast, functional, 
              and up to date long after launch. This service is optional, but strongly recommended 
              for all websites hosted with us.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Management Matters */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Why Management Matters</h2>
              <p className="text-lg text-muted-foreground">
                Websites are not "set and forget" assets — updates, fixes, and changes are inevitable. 
                Ongoing management prevents small issues from becoming costly problems.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    What Website Management Includes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {managementIncludes.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-muted-foreground border-t border-border/50 pt-6">
                    This allows you to focus on running your business while we handle the technical side.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Website Management Pricing</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {managementPlans.map((plan, index) => (
                <motion.div key={index} variants={fadeUp}>
                  <Card className={`h-full relative ${plan.recommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}>
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pt-8">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground ml-2">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Custom Elite */}
            <motion.div variants={fadeUp} className="mt-8 max-w-3xl mx-auto">
              <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-gold" />
                      Custom Elite Website Management
                    </CardTitle>
                    <Badge variant="outline" className="border-gold/50 text-gold">Custom Pricing</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Available under Custom Elite in Web Services. Includes everything above, plus:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {["Advanced troubleshooting", "Ongoing optimisation", "Priority support", "Full technical oversight"].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gold" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground italic">
                    Ideal for complex or high-traffic websites. Price based on website size and complexity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hosting Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <Server className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Hosting With Us (Netlify)</h2>
              <p className="text-lg text-muted-foreground">
                We host websites using Netlify, a reliable and scalable hosting platform.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="border-primary/20 mb-8">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg mb-6">
                    <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Important:</p>
                      <p className="text-muted-foreground">
                        We only charge exactly what Netlify charges us. <strong>We do not profit from hosting.</strong>
                      </p>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-4">Typical Netlify Hosting Costs</h3>
                  <div className="space-y-3">
                    {hostingCosts.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">{item.type}</span>
                        <span className="font-semibold">{item.cost}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Hosting costs depend on traffic, bandwidth, and site complexity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Self-Hosting Section */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">If You Host the Website Yourself</h2>
              <p className="text-lg text-muted-foreground">
                You are free to host your website independently.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-8">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    Once the site leaves our hosting and management:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                      <span className="text-muted-foreground">We do not provide ongoing edits or updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                      <span className="text-muted-foreground">The website is considered complete and delivered</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* One-Off Edit Pricing */}
            <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    One-Off Edit Pricing
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">(No Management Plan)</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">Pricing customized for your requirements</div>
                  <p className="text-sm text-muted-foreground">
                    Includes one dedicated edit session where multiple changes can be made. 
                    Contact us for a personalized quote based on your specific needs.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Pricing reflects the time required for manual code edits and deployment.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-destructive" />
                    Fixes Without a Management Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-semibold">Small Code Fix</div>
                    <div className="text-muted-foreground">Quote on request</div>
                    <p className="text-sm text-muted-foreground">(e.g. broken contact form, layout issue, minor bug)</p>
                  </div>
                  <div>
                    <div className="font-semibold text-destructive">Emergency / Priority Fix</div>
                    <div className="text-muted-foreground">Quote on request</div>
                    <p className="text-sm text-muted-foreground">Applies if the site is down or requires urgent attention. Charged at a premium due to priority scheduling.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Recommendation */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-primary bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Our Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground mb-6">
                  If your website is hosted with us, we strongly recommend a Website Management & Maintenance plan.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-destructive mb-3">Without management:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-1" />
                        <span className="text-muted-foreground">Edits become costly over time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-1" />
                        <span className="text-muted-foreground">Emergency fixes are significantly more expensive</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-1" />
                        <span className="text-muted-foreground">Small issues can impact performance and conversions</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-3">With management:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                        <span className="text-muted-foreground">Predictable monthly cost</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                        <span className="text-muted-foreground">Faster updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                        <span className="text-muted-foreground">Ongoing peace of mind</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-display font-bold mb-6">Summary</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  "You can host yourself or with us",
                  "Hosting is charged at cost (no markup)",
                  "Individual edits available at competitive rates",
                  "Management plans are the most cost-effective option long-term",
                  "Custom Elite plans include full technical oversight"
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    </Layout>
  );
}
