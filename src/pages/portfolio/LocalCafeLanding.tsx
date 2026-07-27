import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Phone, Star, Coffee, Cake, Leaf, UtensilsCrossed } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { name: "Flat White", price: "£3.50", desc: "Double shot, velvety milk", icon: Coffee },
  { name: "Sourdough Toast", price: "£4.95", desc: "Avocado, cherry tomatoes, seeds", icon: UtensilsCrossed },
  { name: "Carrot Cake", price: "£3.95", desc: "Homemade, cream cheese frosting", icon: Cake },
  { name: "Matcha Latte", price: "£4.20", desc: "Ceremonial grade, oat milk", icon: Leaf },
  { name: "Eggs Benedict", price: "£8.50", desc: "Free-range, hollandaise, sourdough", icon: UtensilsCrossed },
  { name: "Chai Spiced Bun", price: "£3.25", desc: "Warm spices, raisin, glaze", icon: Cake },
];

const reviews = [
  { name: "Sarah M.", text: "Best coffee in town! The sourdough toast is incredible.", rating: 5 },
  { name: "James K.", text: "Cozy atmosphere, friendly staff, amazing cakes.", rating: 5 },
  { name: "Emily R.", text: "My go-to spot for brunch. Never disappoints!", rating: 5 },
];

export default function LocalCafeLanding() {
  return (
    <Layout>
      {/* Showcase Banner */}
      <div className="bg-muted/50 border-b border-border/50 py-2 px-4 text-center text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-primary hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Starter</Badge>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(30 60% 96%), hsl(25 50% 90%))" }}>
        <div className="container-tight py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-6xl mb-6 block">☕</span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6" style={{ color: "hsl(25 40% 25%)" }}>
              Freshly Brewed,<br />Locally Loved
            </h1>
            <p className="text-lg md:text-xl max-w-xl mx-auto mb-8" style={{ color: "hsl(25 30% 40%)" }}>
              Artisan coffee & homemade food in the heart of the neighbourhood. Every cup tells a story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="rounded-full font-bold" style={{ background: "hsl(25 60% 40%)", color: "white" }}>
                View Our Menu
              </Button>
              <Button size="xl" variant="outline" className="rounded-full" style={{ borderColor: "hsl(25 40% 60%)", color: "hsl(25 40% 30%)" }}>
                Order Online
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-20 px-4" style={{ background: "hsl(30 30% 98%)" }}>
        <div className="container-tight">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: "hsl(25 40% 25%)" }}>
            Our Favourites
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6 border hover:-translate-y-1 transition-all duration-300"
                style={{ background: "white", borderColor: "hsl(30 30% 88%)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(25 60% 92%)" }}>
                    <item.icon className="w-5 h-5" style={{ color: "hsl(25 60% 40%)" }} />
                  </div>
                  <span className="font-display font-bold text-lg" style={{ color: "hsl(25 60% 40%)" }}>{item.price}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-1" style={{ color: "hsl(25 40% 25%)" }}>{item.name}</h3>
                <p className="text-sm" style={{ color: "hsl(25 20% 55%)" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-20 px-4" style={{ background: "hsl(25 50% 95%)" }}>
        <div className="container-tight grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: "Opening Hours", lines: ["Mon–Fri: 7am – 5pm", "Sat–Sun: 8am – 4pm"] },
            { icon: MapPin, title: "Find Us", lines: ["42 High Street", "London, SW1A 1AA"] },
            { icon: Phone, title: "Get in Touch", lines: ["020 7123 4567", "hello@thelocalcafe.co.uk"] },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-8 text-center border" style={{ background: "white", borderColor: "hsl(30 30% 88%)" }}>
              <card.icon className="w-8 h-8 mx-auto mb-4" style={{ color: "hsl(25 60% 40%)" }} />
              <h3 className="font-display font-bold text-lg mb-3" style={{ color: "hsl(25 40% 25%)" }}>{card.title}</h3>
              {card.lines.map((line, j) => (
                <p key={j} className="text-sm" style={{ color: "hsl(25 20% 50%)" }}>{line}</p>
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-4" style={{ background: "hsl(30 30% 98%)" }}>
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "hsl(25 40% 25%)" }}>What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "hsl(30 30% 88%)" }}>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: "hsl(40 90% 50%)" }} />
                  ))}
                </div>
                <p className="text-sm mb-3" style={{ color: "hsl(25 20% 40%)" }}>"{r.text}"</p>
                <p className="font-display font-bold text-sm" style={{ color: "hsl(25 40% 30%)" }}>{r.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/50" style={{ background: "hsl(25 50% 95%)" }}>
        <div className="container-tight text-center">
          <p className="text-sm font-medium mb-2" style={{ color: "hsl(25 60% 40%)" }}>Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(25 40% 25%)" }}>+150% Online Orders</p>
          <p className="text-muted-foreground mb-6">Real results from a Starter package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
