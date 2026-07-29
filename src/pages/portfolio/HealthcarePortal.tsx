import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Calendar, FileText, Video, Shield, Award, Clock, Phone, Users, Activity } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const services = [
  { icon: Calendar, title: "Book Appointments", desc: "Schedule in-person or virtual visits with ease." },
  { icon: FileText, title: "Medical Records", desc: "Securely access your health records anytime." },
  { icon: Activity, title: "Prescriptions", desc: "Request refills and track medications online." },
  { icon: Video, title: "Telehealth", desc: "Video consultations from the comfort of home." },
];

const doctors = [
  { name: "Dr. Sarah Mitchell", specialty: "General Practice", initials: "SM" },
  { name: "Dr. James Okonkwo", specialty: "Cardiology", initials: "JO" },
  { name: "Dr. Emily Zhang", specialty: "Paediatrics", initials: "EZ" },
  { name: "Dr. Amir Patel", specialty: "Dermatology", initials: "AP" },
];

const testimonials = [
  { name: "Margaret T.", text: "The portal makes managing my appointments so much easier. Truly patient-first.", rating: 5 },
  { name: "David L.", text: "Telehealth saved me during the winter. Excellent care from Dr. Mitchell.", rating: 5 },
];

const badges = [
  { icon: Shield, label: "NHS Approved" },
  { icon: Award, label: "CQC Outstanding" },
  { icon: Heart, label: "GDPR Compliant" },
  { icon: Users, label: "500K+ Patients" },
];

export default function HealthcarePortal() {
  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border/50 py-2 px-4 text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-primary hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Custom Elite</Badge>
      </div>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, hsl(170 40% 95%), hsl(200 40% 92%))" }}>
        <div className="container-tight py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "hsl(170 50% 40%)" }}>
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6" style={{ color: "hsl(200 40% 20%)" }}>
              Your Health,<br />Our Priority
            </h1>
            <p className="text-lg max-w-xl mb-8" style={{ color: "hsl(200 20% 45%)" }}>
              Access appointments, records, and telehealth — all in one secure patient portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" className="rounded-xl font-bold" style={{ background: "hsl(170 50% 40%)", color: "white" }}>
                Patient Portal
              </Button>
              <Button size="xl" variant="outline" className="rounded-xl" style={{ borderColor: "hsl(170 30% 60%)", color: "hsl(200 40% 25%)" }}>
                Book Appointment
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ background: "hsl(170 50% 40%)" }}>
        <div className="container-tight py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-white">
              <b.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4" style={{ background: "hsl(200 30% 98%)" }}>
        <div className="container-tight">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: "hsl(200 40% 20%)" }}>Our Services</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-8 bg-white border hover:-translate-y-1 transition-all duration-300" style={{ borderColor: "hsl(200 20% 90%)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(170 40% 93%)" }}>
                  <s.icon className="w-6 h-6" style={{ color: "hsl(170 50% 40%)" }} />
                </div>
                <h3 className="font-display font-bold text-xl mb-2" style={{ color: "hsl(200 40% 20%)" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "hsl(200 15% 50%)" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "hsl(200 40% 20%)" }}>Our Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {doctors.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-display font-bold text-xl text-white" style={{ background: "hsl(170 50% 40%)" }}>
                  {d.initials}
                </div>
                <h4 className="font-display font-bold text-sm" style={{ color: "hsl(200 40% 20%)" }}>{d.name}</h4>
                <p className="text-xs text-muted-foreground">{d.specialty}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4" style={{ background: "hsl(200 30% 97%)" }}>
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "hsl(200 40% 20%)" }}>Patient Stories</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-8 bg-white border" style={{ borderColor: "hsl(200 20% 90%)" }}>
                <p className="text-lg mb-4 italic" style={{ color: "hsl(200 20% 30%)" }}>"{t.text}"</p>
                <p className="font-display font-bold" style={{ color: "hsl(200 40% 20%)" }}>{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/50" style={{ background: "hsl(170 40% 95%)" }}>
        <div className="container-tight text-center">
          <p className="text-sm font-medium mb-2" style={{ color: "hsl(170 50% 40%)" }}>Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(200 40% 20%)" }}>500K Patients Served</p>
          <p className="text-muted-foreground mb-6">Real results from a Custom Elite package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
