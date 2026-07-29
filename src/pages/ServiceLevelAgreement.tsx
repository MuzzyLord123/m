import { motion } from "framer-motion";
import { Shield, Clock, CheckCircle, AlertTriangle, Zap, Server, HeadphonesIcon, Mail, Phone, ArrowUp, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function ServiceLevelAgreement() {
  const responseTimes = [
    {
      plan: "Starter Management",
      price: "Custom Quote",
      initialResponse: "48 hours",
      bugFix: "5 business days",
      contentUpdate: "5 business days",
      emergency: "24 hours",
      supportHours: "Mon-Fri, 9am-5pm"
    },
    {
      plan: "Business Management",
      price: "Custom Quote",
      initialResponse: "24 hours",
      bugFix: "3 business days",
      contentUpdate: "2 business days",
      emergency: "12 hours",
      supportHours: "Mon-Fri, 9am-6pm"
    },
    {
      plan: "eCommerce Management",
      price: "Custom Quote",
      initialResponse: "12 hours",
      bugFix: "2 business days",
      contentUpdate: "1 business day",
      emergency: "4 hours",
      supportHours: "Mon-Sat, 9am-8pm"
    },
    {
      plan: "Custom Elite",
      price: "Custom Quote",
      initialResponse: "4 hours",
      bugFix: "Same day",
      contentUpdate: "Same day",
      emergency: "1 hour",
      supportHours: "24/7 Priority"
    }
  ];

  const uptimeGuarantees = [
    { plan: "Starter Management", uptime: "99.5%", credits: "5% per 0.1% below" },
    { plan: "Business Management", uptime: "99.7%", credits: "10% per 0.1% below" },
    { plan: "eCommerce Management", uptime: "99.9%", credits: "15% per 0.1% below" },
    { plan: "Custom Elite", uptime: "99.99%", credits: "25% per 0.01% below" },
  ];

  const planComparison = [
    { feature: "Monthly Price", starter: "Custom", business: "Custom", ecommerce: "Custom", elite: "Custom" },
    { feature: "Initial Response", starter: "48 hrs", business: "24 hrs", ecommerce: "12 hrs", elite: "4 hrs" },
    { feature: "Bug Fixes", starter: "5 days", business: "3 days", ecommerce: "2 days", elite: "Same day" },
    { feature: "Content Updates", starter: "5 days", business: "2 days", ecommerce: "1 day", elite: "Same day" },
    { feature: "Emergency Response", starter: "24 hrs", business: "12 hrs", ecommerce: "4 hrs", elite: "1 hr" },
    { feature: "Uptime Guarantee", starter: "99.5%", business: "99.7%", ecommerce: "99.9%", elite: "99.99%" },
    { feature: "Support Hours", starter: "Mon-Fri 9-5", business: "Mon-Fri 9-6", ecommerce: "Mon-Sat 9-8", elite: "24/7" },
    { feature: "Priority Support", starter: "—", business: "✓", ecommerce: "✓", elite: "✓" },
    { feature: "Dedicated Manager", starter: "—", business: "—", ecommerce: "—", elite: "✓" },
    { feature: "Advanced Troubleshooting", starter: "—", business: "—", ecommerce: "✓", elite: "✓" },
    { feature: "Performance Optimisation", starter: "Basic", business: "Standard", ecommerce: "Advanced", elite: "Premium" },
    { feature: "Security Monitoring", starter: "Basic", business: "Standard", ecommerce: "Enhanced", elite: "Enterprise" },
  ];

  const escalationSteps = [
    {
      tier: "Tier 1",
      title: "Initial Support",
      description: "First point of contact for all requests",
      timeframe: "Within SLA response time",
      actions: [
        "Issue acknowledgement and ticket creation",
        "Basic troubleshooting and quick fixes",
        "Content updates and minor changes",
        "Documentation and FAQ guidance"
      ]
    },
    {
      tier: "Tier 2",
      title: "Technical Support",
      description: "Escalated for complex technical issues",
      timeframe: "If unresolved within 24 hours",
      actions: [
        "In-depth technical investigation",
        "Code-level debugging and fixes",
        "Performance analysis and optimisation",
        "Integration troubleshooting"
      ]
    },
    {
      tier: "Tier 3",
      title: "Senior Engineering",
      description: "Critical issues requiring senior expertise",
      timeframe: "If unresolved within 48 hours",
      actions: [
        "Architecture-level problem solving",
        "Complex security incident response",
        "Major feature restoration",
        "Third-party vendor coordination"
      ]
    },
    {
      tier: "Tier 4",
      title: "Management Escalation",
      description: "Executive involvement for critical situations",
      timeframe: "Site down >4 hours or repeated failures",
      actions: [
        "Direct management oversight",
        "Resource reallocation if needed",
        "Client communication and updates",
        "Post-incident review and prevention"
      ]
    }
  ];

  const inclusions = [
    {
      title: "What's Included in Response Times",
      items: [
        "Initial acknowledgement of your request",
        "Assessment of issue severity",
        "Assignment to appropriate team member",
        "Start of active work on resolution",
        "Regular status updates until resolved"
      ]
    },
    {
      title: "Emergency Criteria",
      items: [
        "Website completely down/inaccessible",
        "Payment processing failure",
        "Security breach or vulnerability",
        "Data loss or corruption",
        "Critical functionality broken"
      ]
    }
  ];

  const exclusions = [
    "Third-party service outages (hosting, DNS, CDN)",
    "Client-side issues (browser, network, device)",
    "Scheduled maintenance windows",
    "Force majeure events",
    "Issues caused by unauthorized modifications",
    "Features or changes not covered by your plan"
  ];

  return (
    <Layout>
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Company"
        index="34"
        crumbs={[{ label: "Home", href: "/" }, { label: "Service level agreement" }]}
        title="The service"
        highlight="agreement"
        body="Response times, uptime and responsibilities — the commitments we put our name to."
      />

      {/* Plan Comparison Table */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="mb-12">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Plan Comparison</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Compare all management plans side-by-side to find the right fit for your business.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Feature</TableHead>
                    <TableHead className="text-center">Starter</TableHead>
                    <TableHead className="text-center">Business</TableHead>
                    <TableHead className="text-center">eCommerce</TableHead>
                    <TableHead className="text-center bg-gold/5">
                      <span className="text-gold">Custom Elite</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planComparison.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{row.starter}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{row.business}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{row.ecommerce}</TableCell>
                      <TableCell className="text-center bg-gold/5 font-medium">{row.elite}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Response Times Table */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="mb-12">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Response Time Guarantees</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                We commit to these response times for all support requests based on your management plan.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Plan</TableHead>
                    <TableHead>Initial Response</TableHead>
                    <TableHead>Bug Fixes</TableHead>
                    <TableHead>Content Updates</TableHead>
                    <TableHead>Emergency</TableHead>
                    <TableHead>Support Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responseTimes.map((plan, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="font-semibold">{plan.plan}</span>
                          <span className="block text-xs text-muted-foreground">{plan.price}</span>
                        </div>
                      </TableCell>
                      <TableCell>{plan.initialResponse}</TableCell>
                      <TableCell>{plan.bugFix}</TableCell>
                      <TableCell>{plan.contentUpdate}</TableCell>
                      <TableCell className="text-destructive font-medium">{plan.emergency}</TableCell>
                      <TableCell className="text-sm">{plan.supportHours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Uptime Guarantees */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="mb-12">
              <Server className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Uptime Guarantees</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                We guarantee minimum uptime for websites hosted with us. If we fall short, you receive service credits.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {uptimeGuarantees.map((item, index) => (
                <motion.div key={index} variants={fadeUp}>
                  <Card className={`h-full text-center ${index === 3 ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-transparent' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.plan}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary mb-2">{item.uptime}</div>
                      <p className="text-sm text-muted-foreground">Guaranteed Uptime</p>
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Credit:</strong> {item.credits}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="mt-8 max-w-3xl mx-auto">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-2">How Uptime Credits Work</p>
                      <p className="text-sm text-muted-foreground">
                        If monthly uptime falls below the guaranteed percentage, you will receive a credit 
                        on your next invoice. Credits are calculated based on the percentage shortfall 
                        and applied automatically. Maximum credit is 100% of monthly management fee.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Inclusions & Emergency Criteria */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {inclusions.map((section, index) => (
                <motion.div key={index} variants={fadeUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {index === 0 ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <Zap className="w-5 h-5 text-destructive" />
                        )}
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className={`w-4 h-4 shrink-0 mt-1 ${index === 0 ? 'text-primary' : 'text-destructive'}`} />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Escalation Policy */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="mb-12">
              <ArrowUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Escalation Policy</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                How issues are escalated through our support tiers to ensure timely resolution.
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {escalationSteps.map((step, index) => (
                  <motion.div key={index} variants={fadeUp} className="relative">
                    {index < escalationSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-border z-10" />
                    )}
                    <Card className={`h-full ${index === 3 ? 'border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent' : ''}`}>
                      <CardHeader className="pb-2">
                        <Badge variant={index === 3 ? "destructive" : "secondary"} className="w-fit mb-2">
                          {step.tier}
                        </Badge>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            <strong>Trigger:</strong> {step.timeframe}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {step.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-1" />
                              <span className="text-xs text-muted-foreground">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="mt-8">
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-2">Automatic Escalation</p>
                        <p className="text-sm text-muted-foreground">
                          Issues are automatically escalated if response time SLAs are not met. You can also 
                          request immediate escalation for critical business impact. Custom Elite clients have 
                          direct access to senior engineering and management escalation at any time.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exclusions */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  SLA Exclusions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  The following are not covered by our SLA guarantees:
                </p>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  {exclusions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="mb-12">
              <HeadphonesIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold mb-4">Support Channels</h2>
              <p className="text-lg text-muted-foreground">
                Multiple ways to reach us based on urgency and preference.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For non-urgent requests and detailed documentation
                    </p>
                    <a href="mailto:Support@quooro.com" className="text-primary hover:underline">
                      Support@quooro.com
                    </a>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="h-full text-center border-primary">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Phone Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For urgent issues requiring immediate attention
                    </p>
                    <a href="tel:07739346789" className="text-primary hover:underline">
                      07739 346789
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">5PM - 9PM Daily</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-destructive" />
                    </div>
                    <h3 className="font-semibold mb-2">Emergency Line</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For critical outages (Custom Elite only)
                    </p>
                    <p className="text-muted-foreground text-sm">
                      24/7 Priority Access
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Effective Date */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            This Service Level Agreement is effective from January 2025 and applies to all active Website Management plans.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>
      </section>
    </div>
    </Layout>
  );
}
