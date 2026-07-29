import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, ArrowRight, Star, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = ["Dresses", "Outerwear", "Accessories", "Knitwear"];

const products = [
  { name: "Silk Midi Dress", price: "£189", category: "New In", color: "hsl(var(--accent))" },
  { name: "Wool Overcoat", price: "£345", category: "Bestseller", color: "hsl(var(--secondary))" },
  { name: "Leather Tote", price: "£225", category: "Accessories", color: "hsl(var(--accent))" },
  { name: "Cashmere Jumper", price: "£165", category: "Knitwear", color: "hsl(var(--muted))" },
  { name: "Linen Blazer", price: "£210", category: "New In", color: "hsl(var(--secondary))" },
  { name: "Statement Earrings", price: "£75", category: "Accessories", color: "hsl(var(--accent))" },
];

const trending = [
  { name: "Oversized Trench", price: "£295" },
  { name: "Ribbed Bodysuit", price: "£55" },
  { name: "Chain Belt", price: "£85" },
  { name: "Pleated Skirt", price: "£135" },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function FashionEcommerce() {
  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border/30 py-2 px-4 text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-brand hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Professional</Badge>
      </div>

      {/* Hero */}
      <section className="bg-foreground dark:bg-background">
        <div className="container-tight py-28 md:py-40">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] uppercase mb-6 text-muted-foreground">
              Aurelia — Spring/Summer 2026
            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-6xl md:text-8xl font-bold mb-8 text-background dark:text-foreground tracking-tight leading-[0.95]">
              New Season<br />Collection
            </motion.h1>
            <motion.div variants={fadeUp}>
              <Button size="xl" className="rounded-lg tracking-widest uppercase text-sm font-bold px-12 bg-background text-foreground dark:bg-foreground dark:text-background hover:opacity-90 transition-opacity">
                Shop Now
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container-tight">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {categories.map((cat, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group cursor-pointer text-center py-12 border border-border/50 rounded-xl transition-all duration-200 hover:bg-foreground hover:text-background hover:border-foreground hover:shadow-lg">
                <span className="font-display text-lg tracking-widest uppercase">{cat}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Featured Pieces</h2>
            <button className="text-sm flex items-center gap-2 hover:gap-3 transition-all text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {products.map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="group cursor-pointer">
                <div className="aspect-[3/4] rounded-xl mb-4 relative overflow-hidden" style={{ background: p.color }}>
                  <div className="absolute top-3 left-3">
                    <span className="text-xs tracking-wider uppercase px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-md font-medium">{p.category}</span>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                    <button className="w-full py-3 text-xs tracking-widest uppercase font-bold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
                      Quick Add
                    </button>
                  </div>
                </div>
                <h3 className="font-display text-sm tracking-wide">{p.name}</h3>
                <p className="text-sm mt-1 text-muted-foreground">{p.price}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 px-4 border-t border-border/30 bg-muted/50">
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">Trending Now</h2>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {trending.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex justify-between items-center py-4 border-b border-border/50 cursor-pointer hover:pl-2 transition-all duration-200">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-sm text-muted-foreground">{t.price}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 bg-foreground dark:bg-card">
        <div className="container-tight text-center max-w-md mx-auto">
          <Mail className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display text-2xl font-bold text-background dark:text-foreground mb-3">Join the List</h2>
          <p className="text-sm mb-6 text-muted-foreground">Be the first to know about new arrivals and exclusive offers.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email" className="flex-1 px-4 py-3 text-sm bg-background/10 border border-background/20 text-background dark:text-foreground placeholder:text-background/40 dark:placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50" />
            <button className="px-6 py-3 text-xs tracking-widest uppercase font-bold bg-background text-foreground dark:bg-brand dark:text-brand-foreground rounded-lg hover:opacity-90 transition-opacity">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/30 bg-background">
        <div className="container-tight text-center">
          <p className="text-sm font-medium text-brand mb-2">Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2">+£50K Monthly Sales</p>
          <p className="text-muted-foreground mb-6">Real results from a Professional package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
