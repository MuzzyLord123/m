import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  LogOut,
  MessageSquare,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { quickSignOut } from '@/hooks/useAuthSync';
import quooroLogo from '@/assets/quooro-logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SecureImage from '@/components/SecureImage';

interface CustomerUpload {
  id: string;
  title: string;
  notes: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

const uploadStatusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending Review' },
  reviewed: { color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Eye, label: 'Reviewed' },
  implemented: { color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: 'Implemented' },
  'needs-clarification': { color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: AlertCircle, label: 'Needs Clarification' },
};

// Premium Apple-like animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17,
    },
  },
  tap: { scale: 0.98 },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export default function CustomerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<CustomerUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<CustomerUpload | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect to new lounge experience
    navigate('/lounge');
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await quickSignOut('customer');
    navigate('/sign-in', { replace: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!user) return;

    setUploading(true);
    try {
      let imageUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('customer-uploads')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Store the file path instead of public URL (bucket is private)
        imageUrl = fileName;
      }

      const { error: dbError } = await supabase
        .from('customer_uploads')
        .insert({
          user_id: user.id,
          title: title.trim(),
          notes: notes.trim() || null,
          image_url: imageUrl
        });

      if (dbError) throw dbError;

      toast.success('Upload saved successfully!');
      setDialogOpen(false);
      setTitle('');
      setNotes('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchUploads();
    } catch (error) {
      console.error('Error saving upload:', error);
      toast.error('Failed to save upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    try {
      const { error } = await supabase
        .from('customer_uploads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (imageUrl && user) {
        // imageUrl is now a file path, not a full URL
        const path = imageUrl.includes('/customer-uploads/') 
          ? imageUrl.split('/customer-uploads/')[1] 
          : imageUrl;
        if (path) {
          await supabase.storage.from('customer-uploads').remove([path]);
        }
      }

      toast.success('Upload deleted');
      setSelectedUpload(null);
      fetchUploads();
    } catch (error) {
      console.error('Error deleting upload:', error);
      toast.error('Failed to delete upload');
    }
  };

  const stats = {
    total: uploads.length,
    pending: uploads.filter(u => (u.status || 'pending') === 'pending').length,
    reviewed: uploads.filter(u => u.status === 'reviewed').length,
    implemented: uploads.filter(u => u.status === 'implemented').length,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header with blur effect */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between">
            {/* Logo & Title */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img 
                src={quooroLogo} 
                alt="Quooro" 
                className="h-7 sm:h-8 w-auto dark:brightness-0 dark:invert"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Quooro Lounge</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[180px] md:max-w-none">{user?.email}</p>
              </div>
            </motion.div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <ThemeToggle />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </motion.div>
            </div>

            {/* Mobile Menu */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <motion.div 
                    className="flex flex-col h-full py-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="space-y-2 mb-8">
                      <img 
                        src={quooroLogo} 
                        alt="Quooro" 
                        className="h-8 w-auto dark:brightness-0 dark:invert"
                      />
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="flex-1" />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }} 
                      className="w-full gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </motion.div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8 lg:space-y-10"
        >
          {/* Welcome Section */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="space-y-1">
              <motion.p 
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {getGreeting()}
              </motion.p>
              <motion.h2 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                Welcome to your Lounge
              </motion.h2>
              <motion.p 
                className="text-muted-foreground text-sm sm:text-base max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Upload images and notes for your development team to review.
              </motion.p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    New Upload
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-4 sm:mx-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create Upload</DialogTitle>
                </DialogHeader>
                <motion.div 
                  className="space-y-5 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Homepage design feedback"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or instructions for the dev team..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image (optional)</Label>
                    <AnimatePresence mode="wait">
                      {previewUrl ? (
                        <motion.div 
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative rounded-xl overflow-hidden"
                        >
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-48 object-cover"
                          />
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl(null);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.label 
                          key="upload"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ scale: 1.01, borderColor: 'hsl(var(--primary))' }}
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/30 transition-all duration-300"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground/60 mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </motion.label>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full h-11"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <span className="flex items-center gap-2">
                          <motion.div 
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Saving...
                        </span>
                      ) : 'Save Upload'}
                    </Button>
                  </motion.div>
                </motion.div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats Cards - Apple-like with stagger animation */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { label: 'Total Uploads', value: stats.total, icon: FileText, gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
              { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500' },
              { label: 'Reviewed', value: stats.reviewed, icon: Eye, gradient: 'from-blue-500/10 to-blue-500/5', iconColor: 'text-blue-500' },
              { label: 'Implemented', value: stats.implemented, icon: CheckCircle, gradient: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${stat.gradient} p-4 sm:p-5 cursor-default transition-shadow hover:shadow-lg hover:shadow-primary/5`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <motion.p 
                      className="text-2xl sm:text-3xl font-bold tracking-tight"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                  <motion.div 
                    className="p-2 sm:p-2.5 rounded-xl bg-background/60 backdrop-blur-sm"
                    whileHover={{ rotate: 5 }}
                  >
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Uploads Section */}
          <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight">Your Uploads</h3>
            </div>
            
            {loading ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i} 
                    variants={itemVariants}
                    className="rounded-2xl border border-border/50 bg-card p-4"
                  >
                    <div className="h-40 bg-muted rounded-xl mb-4 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </motion.div>
                ))}
              </motion.div>
            ) : uploads.length === 0 ? (
              <motion.div 
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 rounded-3xl border-2 border-dashed border-border/50 bg-muted/20"
              >
                <motion.div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
                </motion.div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No uploads yet</h4>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  Start by uploading images and notes for your development team.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Upload
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {uploads.map((upload) => {
                    const statusConfig = uploadStatusConfig[upload.status || 'pending'];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <motion.div
                        key={upload.id}
                        layout
                        variants={cardHoverVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        animate="rest"
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedUpload(upload)}
                      >
                        {upload.image_url ? (
                          <div className="relative h-44 sm:h-48 overflow-hidden">
                            <SecureImage
                              src={upload.image_url}
                              alt={upload.title}
                              className="w-full h-full object-cover"
                            />
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                            <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">{upload.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(upload.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${statusConfig.color} border gap-1.5 text-xs font-medium`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                          {upload.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                              {upload.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>

          {/* Contact Support Card with premium animation */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 group"
          >
            <motion.div 
              className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                  Need to discuss your project?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our team is here to help you every step of the way.
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2 shrink-0 w-full sm:w-auto shadow-lg shadow-primary/25">
                  Contact Support
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Upload Detail Dialog with smooth animations */}
      <AnimatePresence>
        {selectedUpload && (
          <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
            <DialogContent className="max-w-lg mx-4 sm:mx-auto rounded-2xl p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {selectedUpload.image_url && (
                  <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                    <SecureImage
                      src={selectedUpload.image_url}
                      alt={selectedUpload.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{selectedUpload.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedUpload.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {(() => {
                    const statusConfig = uploadStatusConfig[selectedUpload.status || 'pending'];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig.color} border gap-1.5 text-sm font-medium`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </Badge>
                    );
                  })()}
                  
                  {selectedUpload.notes && (
                    <div className="pt-2">
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</Label>
                      <p className="text-foreground whitespace-pre-wrap">{selectedUpload.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedUpload(null)}
                      >
                        Close
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDelete(selectedUpload.id, selectedUpload.image_url)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
