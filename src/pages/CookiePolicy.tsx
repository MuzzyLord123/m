import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Cookie, Settings, BarChart3, Megaphone, Shield } from "lucide-react";

const cookieCategories = [
  {
    icon: Shield,
    category: "Essential Cookies",
    required: true,
    description: "These cookies are strictly necessary for the website to function. They cannot be disabled.",
    cookies: [
      { name: "session_id", purpose: "Maintains your session state", duration: "Session" },
      { name: "cookie_consent", purpose: "Stores your cookie preferences", duration: "1 year" },
      { name: "csrf_token", purpose: "Protects against cross-site request forgery", duration: "Session" },
    ]
  },
  {
    icon: BarChart3,
    category: "Analytics Cookies",
    required: false,
    description: "Help us understand how visitors interact with our website to improve user experience.",
    cookies: [
      { name: "_ga", purpose: "Google Analytics - distinguishes users", duration: "2 years" },
      { name: "_gid", purpose: "Google Analytics - distinguishes users", duration: "24 hours" },
      { name: "_gat", purpose: "Google Analytics - throttles request rate", duration: "1 minute" },
    ]
  },
  {
    icon: Megaphone,
    category: "Marketing Cookies",
    required: false,
    description: "Used to track visitors across websites to display relevant advertisements.",
    cookies: [
      { name: "_fbp", purpose: "Facebook - tracks visits across websites", duration: "3 months" },
      { name: "_gcl_au", purpose: "Google Ads - conversion tracking", duration: "3 months" },
    ]
  }
];

export default function CookiePolicy() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="container-tight relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Cookie className="w-4 h-4" />
                <span className="text-sm font-medium">Cookie Information</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
                Cookie Policy
              </h1>
              <p className="text-lg text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-12 border-b border-border">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                What Are Cookies?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Cookies are small text files placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analysing how you use our site, and enabling certain features.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Under UK GDPR and the Privacy and Electronic Communications Regulations (PECR), we are required to obtain your consent before placing non-essential cookies on your device.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Cookie Categories */}
        <section className="py-16">
          <div className="container-tight">
            <div className="max-w-4xl mx-auto space-y-12">
              {cookieCategories.map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-border rounded-2xl p-6 md:p-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-display font-semibold text-foreground">
                        {category.category}
                      </h2>
                    </div>
                    {category.required ? (
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Required
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                        Optional
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    {category.description}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-foreground">Cookie Name</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Purpose</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.cookies.map((cookie) => (
                          <tr key={cookie.name} className="border-b border-border/50 last:border-0">
                            <td className="py-3 px-4 font-mono text-xs text-primary">{cookie.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">{cookie.purpose}</td>
                            <td className="py-3 px-4 text-muted-foreground">{cookie.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="py-16 bg-secondary/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground">
                  Managing Your Cookie Preferences
                </h2>
              </div>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You can manage your cookie preferences at any time using our cookie settings banner. Click "Cookie Settings" at the bottom of any page to update your choices.
                </p>
                <p>
                  You can also control cookies through your browser settings:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                  <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
                </ul>
                <p className="mt-4">
                  Note: Blocking essential cookies may prevent certain features of our website from functioning correctly.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Questions About Cookies?
              </h2>
              <p className="text-muted-foreground mb-6">
                If you have any questions about our use of cookies, please contact our Data Protection Officer at{" "}
                <a href="mailto:Support@quooro.com" className="text-primary hover:underline">
                  Support@quooro.com
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
