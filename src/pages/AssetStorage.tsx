import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Cloud, 
  Folder, 
  Tag, 
  Download, 
  Upload, 
  HardDrive,
  FileImage,
  FileVideo,
  FileText,
  FileArchive,
  CheckCircle2,
  Zap,
  Globe,
  Key,
  Server,
  Eye,
  RefreshCw,
  Users,
  Clock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ScrollSection, StaggeredScrollSection, ScrollItem } from '@/components/ScrollSection';

const securityFeatures = [
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'All files are encrypted at rest using military-grade AES-256 encryption, the same standard used by banks and government agencies.',
  },
  {
    icon: Shield,
    title: 'TLS 1.3 In Transit',
    description: 'Every file transfer is protected with TLS 1.3 encryption, ensuring your data is secure during upload and download.',
  },
  {
    icon: Key,
    title: 'Private Access Keys',
    description: 'Files are accessed via time-limited signed URLs, preventing unauthorized access even if links are shared.',
  },
  {
    icon: Server,
    title: 'Isolated Storage',
    description: 'Each client\'s files are stored in isolated containers with strict access controls and audit logging.',
  },
  {
    icon: Eye,
    title: 'Access Audit Trail',
    description: 'Complete visibility into who accessed what files and when, with detailed activity logs.',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Files are distributed across a global edge network for fast, reliable access from anywhere.',
  },
];

const storageFeatures = [
  {
    icon: Folder,
    title: 'Folder Organization',
    description: 'Create nested folders to organize your files exactly how you want. Keep projects, assets, and archives neatly separated.',
  },
  {
    icon: Tag,
    title: 'Smart Tagging',
    description: 'Add custom tags to files for quick filtering and search. Find what you need in seconds, not minutes.',
  },
  {
    icon: HardDrive,
    title: '5GB Per Account',
    description: 'Generous storage allocation for all your project files. Need more? Contact us for enterprise plans.',
  },
  {
    icon: RefreshCw,
    title: 'Version History',
    description: 'Automatic file versioning lets you restore previous versions of any file at any time.',
  },
];

const fileTypes = [
  { icon: FileImage, label: 'Images', formats: 'JPG, PNG, GIF, WebP, SVG' },
  { icon: FileVideo, label: 'Videos', formats: 'MP4, WebM, MOV' },
  { icon: FileText, label: 'Documents', formats: 'PDF, DOC, XLS, PPT' },
  { icon: FileArchive, label: 'Archives', formats: 'ZIP, RAR, 7Z' },
];

const benefits = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Upload and download files at blazing speeds with our optimized infrastructure.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share files seamlessly with your team and external partners with granular permissions.',
  },
  {
    icon: Clock,
    title: '99.99% Uptime',
    description: 'Enterprise-grade reliability ensures your files are always accessible when you need them.',
  },
  {
    icon: Download,
    title: 'Bulk Operations',
    description: 'Upload or download multiple files at once. No more one-by-one tedium.',
  },
];

const complianceBadges = [
  'SOC 2 Type II',
  'GDPR Compliant',
  'ISO 27001',
  'HIPAA Ready',
  'PCI DSS',
];

export default function AssetStorage() {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32 lg:py-40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <Shield className="w-4 h-4" />
                Enterprise-Grade Security
              </div>
              
              <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Secure Asset &{' '}
                <span className="text-gradient">File Storage</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl">
                Store, organize, and access your project files with military-grade encryption. 
                Your assets are protected by the same security standards trusted by Fortune 500 companies.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
                  <Link to="/lounge/assets">
                    <Cloud className="w-5 h-5" />
                    Access Your Storage
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/get-started">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* File Types Supported */}
        <ScrollSection className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                All Your File Types, One Secure Home
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From images to documents, videos to archives—store any file type with confidence.
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {fileTypes.map((type, index) => (
                <motion.div
                  key={type.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <type.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">{type.formats}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* Security Features */}
        <StaggeredScrollSection className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <ScrollItem>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                  <Lock className="w-4 h-4" />
                  Bank-Level Security
                </div>
              </ScrollItem>
              <ScrollItem>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Your Files Are Fort Knox Secure
                </h2>
              </ScrollItem>
              <ScrollItem>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We don't just store your files—we protect them with multiple layers of enterprise security.
                </p>
              </ScrollItem>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => (
                <ScrollItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all h-full"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </motion.div>
                </ScrollItem>
              ))}
            </div>
          </div>
        </StaggeredScrollSection>

        {/* Storage Features */}
        <ScrollSection className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                  <Folder className="w-4 h-4" />
                  Powerful Organization
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Stay Organized, Stay Productive
                </h2>
                <p className="text-muted-foreground mb-8">
                  Our intuitive file management system helps you keep everything in order. 
                  Create folders, add tags, and find files instantly with powerful search.
                </p>
                
                <div className="space-y-6">
                  {storageFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative rounded-3xl border border-border/50 bg-card p-6 shadow-2xl"
                >
                  {/* Mock File Manager UI */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <Folder className="w-5 h-5 text-primary" />
                      <span className="font-medium">Project Assets</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <Folder className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">Brand Guidelines</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <FileImage className="w-5 h-5 text-pink-500" />
                      <span className="font-medium">hero-banner.png</span>
                      <span className="text-xs text-muted-foreground ml-auto">2.4 MB</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">contract-v2.pdf</span>
                      <span className="text-xs text-muted-foreground ml-auto">1.8 MB</span>
                    </div>
                  </div>
                  
                  {/* Storage indicator */}
                  <div className="mt-6 p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Storage Used</span>
                      <span className="text-sm text-muted-foreground">2.1 GB / 5 GB</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[42%] bg-primary rounded-full" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Decorative elements */}
                <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* Benefits */}
        <StaggeredScrollSection className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Built for Teams That Move Fast
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every feature designed to help you work smarter, not harder.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <ScrollItem key={benefit.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all h-full"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </motion.div>
                </ScrollItem>
              ))}
            </div>
          </div>
        </StaggeredScrollSection>

        {/* Compliance Section */}
        <ScrollSection className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <Shield className="w-4 h-4" />
                Compliance & Certifications
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Trusted by Regulated Industries
              </h2>
              <p className="text-muted-foreground mb-10">
                Our infrastructure meets the strictest compliance standards, giving you peace of mind 
                whether you're in healthcare, finance, or any regulated industry.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                {complianceBadges.map((badge) => (
                  <motion.div
                    key={badge}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-border/50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium">{badge}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 sm:p-12 lg:p-16 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Secure Your Assets?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of businesses who trust us with their most important files. 
                  Start with 5GB free storage today.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
                    <Link to="/get-started">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/support">Contact Sales</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
