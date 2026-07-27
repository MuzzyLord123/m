import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  MessageSquare,
  Plus,
  Trash2,
  X,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LoungeUploads() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<CustomerUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<CustomerUpload | null>(null);

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8"
      >
        <LoungePageHeader
          title="Uploads"
          description="Share images and notes with your development team."
          icon={Upload}
          actions={
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              New Upload
            </Button>
          }
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md mx-4 sm:mx-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Homepage design feedback"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Image (optional)</Label>
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
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
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all duration-200">
                    <Upload className="w-8 h-8 text-muted-foreground/60 mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full h-11"
                disabled={uploading}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Upload'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            { label: 'Total Uploads', value: stats.total, icon: FileText, gradient: 'from-primary/10 to-primary/5' },
            { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-amber-500/10 to-amber-500/5' },
            { label: 'Reviewed', value: stats.reviewed, icon: Eye, gradient: 'from-blue-500/10 to-blue-500/5' },
            { label: 'Implemented', value: stats.implemented, icon: CheckCircle, gradient: 'from-emerald-500/10 to-emerald-500/5' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${stat.gradient} p-4 sm:p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-background/60 backdrop-blur-sm">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Uploads Grid */}
        <motion.div variants={itemVariants} className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight">Your Uploads</h3>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 animate-pulse">
                  <div className="h-40 bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 rounded-3xl border-2 border-dashed border-border/50 bg-muted/20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No uploads yet</h4>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Start by uploading images and notes for your development team.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Upload
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <AnimatePresence mode="popLayout">
                {uploads.map((upload) => {
                  const statusConfig = uploadStatusConfig[upload.status || 'pending'];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={upload.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedUpload(upload)}
                    >
                      {upload.image_url ? (
                        <div className="relative h-44 sm:h-48 overflow-hidden">
                          <SecureImage
                            src={upload.image_url}
                            alt={upload.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                          <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-foreground line-clamp-1">{upload.title}</h4>
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
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Upload Detail Dialog */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto rounded-2xl p-0 overflow-hidden">
          {selectedUpload && (
            <>
              {selectedUpload.image_url && (
                <div className="relative h-56 sm:h-64 w-full">
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
                      year: 'numeric'
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
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedUpload(null)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(selectedUpload.id, selectedUpload.image_url)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
