import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  LogOut,
  MessageSquare,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import {
  GreetingHeader,
  Panel,
  SectionHeader,
  StatusBadge,
  EmptyState,
  RelativeTime,
  FIELD,
  FIELD_LABEL,
  type Tone,
} from '@/components/platform';
import { cn } from '@/lib/utils';

interface CustomerUpload {
  id: string;
  title: string;
  notes: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

const uploadStatusConfig: Record<string, { tone: Tone; icon: React.ElementType; label: string }> = {
  pending: { tone: 'attend', icon: Clock, label: 'Pending review' },
  reviewed: { tone: 'neutral', icon: Eye, label: 'Reviewed' },
  implemented: { tone: 'ok', icon: CheckCircle, label: 'Implemented' },
  'needs-clarification': { tone: 'attend', icon: AlertCircle, label: 'Needs clarification' },
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

      toast.success('Upload saved');
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background">
        <div className="mx-auto max-w-[1024px] px-5 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <img
                src={quooroLogo}
                alt="Quooro"
                className="h-7 w-auto dark:brightness-0 dark:invert"
              />
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium tracking-[-0.01em] text-foreground">Quooro Lounge</p>
                <p className="max-w-[180px] truncate font-mono text-[10px] text-muted-foreground md:max-w-none">{user?.email}</p>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="flex items-center gap-2 sm:hidden">
              <ThemeToggle />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] border-l border-border/60 sm:w-[320px]">
                  <div className="flex h-full flex-col py-6">
                    <div className="mb-8 space-y-2">
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
                      Sign out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <div className="space-y-6">
          {/* Greeting, with the screen's one primary action */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <GreetingHeader
              salutation={getGreeting()}
              line="Upload images and notes for your development team to review."
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 sm:w-auto">
                  <Plus className="w-4 h-4" />
                  New upload
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 sm:mx-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">New upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className={FIELD_LABEL}>Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Homepage design feedback"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={FIELD}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className={FIELD_LABEL}>Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or instructions for the dev team"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="resize-none rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className={cn(FIELD_LABEL, 'block')}>Image (optional)</span>
                    {previewUrl ? (
                      <div className="relative overflow-hidden rounded-[10px] border border-border/60">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-48 w-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute right-3 top-3 h-8 w-8 rounded-full"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-border/60 transition-colors duration-150 hover:border-primary/50 hover:bg-foreground/[0.02]">
                        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Choose an image to upload</span>
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
                    className="h-10 w-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving
                      </span>
                    ) : 'Save upload'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-border/60 pb-4">
            <span className="font-mono text-[11px] tabular-nums text-ink-2">
              {stats.total} {stats.total === 1 ? 'upload' : 'uploads'}
            </span>
            <StatusBadge tone="attend" label={`${stats.pending} pending review`} />
            <StatusBadge tone="neutral" label={`${stats.reviewed} reviewed`} />
            <StatusBadge tone="ok" label={`${stats.implemented} implemented`} />
          </div>

          {/* Uploads */}
          <section>
            <SectionHeader title="Your uploads" />

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[10px] border border-border/60 bg-card p-4"
                  >
                    <div className="mb-4 h-40 animate-pulse rounded-lg bg-foreground/[0.06]" />
                    <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-foreground/[0.06]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/[0.05]" />
                  </div>
                ))}
              </div>
            ) : uploads.length === 0 ? (
              <Panel>
                <EmptyState
                  title="No uploads yet"
                  body="Start by uploading images and notes for your development team."
                  action={{ label: 'Create your first upload', onClick: () => setDialogOpen(true) }}
                />
              </Panel>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uploads.map((upload) => {
                  const statusConfig = uploadStatusConfig[upload.status || 'pending'];

                  return (
                    <button
                      key={upload.id}
                      type="button"
                      className="group overflow-hidden rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-primary/40 focus-visible:border-primary/60"
                      onClick={() => setSelectedUpload(upload)}
                    >
                      {upload.image_url ? (
                        <div className="h-44 overflow-hidden border-b border-border/60 sm:h-48">
                          <SecureImage
                            src={upload.image_url}
                            alt={upload.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center border-b border-border/60 bg-sunken">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="line-clamp-1 text-[14px] font-medium text-foreground">{upload.title}</h4>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <StatusBadge tone={statusConfig.tone} label={statusConfig.label} />
                          <RelativeTime date={upload.created_at} />
                        </div>
                        {upload.notes && (
                          <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                            {upload.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact the studio */}
          <Panel>
            <div className="flex flex-col items-start gap-3 border-l-2 border-primary px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-foreground">
                  Need to discuss your project?
                </h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Our team is here to help at every step.
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs">
                Contact support
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Panel>
        </div>
      </main>

      {/* Upload detail dialog */}
      {selectedUpload && (
        <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
          <DialogContent className="mx-4 max-w-lg overflow-hidden p-0 sm:mx-auto">
            <div>
              {selectedUpload.image_url && (
                <div className="h-56 w-full overflow-hidden border-b border-border/60 sm:h-64">
                  <SecureImage
                    src={selectedUpload.image_url}
                    alt={selectedUpload.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{selectedUpload.title}</h3>
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {new Date(selectedUpload.created_at).toLocaleDateString('en-GB', {
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
                  return <StatusBadge tone={statusConfig.tone} label={statusConfig.label} />;
                })()}

                {selectedUpload.notes && (
                  <div className="pt-1">
                    <span className={cn(FIELD_LABEL, 'mb-1.5 block')}>Notes</span>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{selectedUpload.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
