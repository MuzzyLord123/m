import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SecureImage from '@/components/SecureImage';
import { format } from 'date-fns';
import {
  PageHeader, StatusBadge, EmptyState, RelativeTime,
  FIELD, FIELD_LABEL,
  type Tone,
} from '@/components/platform';

interface CustomerUpload {
  id: string;
  title: string;
  notes: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

const UPLOAD_STATUS: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: 'attend', label: 'Pending review' },
  reviewed: { tone: 'neutral', label: 'Reviewed' },
  implemented: { tone: 'ok', label: 'Implemented' },
  'needs-clarification': { tone: 'attend', label: 'Needs clarification' },
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
      toast.error('Your uploads did not load. Refresh to try again.');
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
      toast.error('Add a title for your upload');
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
      toast.error('Your upload did not save. Try again.');
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
      toast.error('The upload did not delete. Try again.');
    }
  };

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Uploads"
        description="Share images and notes with the studio"
        actions={
          <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New upload
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New upload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className={FIELD_LABEL}>Title</Label>
              <Input
                id="title"
                placeholder="e.g. Homepage design feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={FIELD}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className={FIELD_LABEL}>Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Image (optional)</Label>
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
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-border transition-colors duration-150 hover:border-primary/50 hover:bg-foreground/[0.02]">
                  <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload an image</span>
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
              className="h-9 w-full rounded-lg text-xs"
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </span>
              ) : 'Save upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Uploads */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[10px] border border-border/60 bg-card p-4">
                <span className="block h-40 animate-pulse rounded-lg bg-foreground/[0.06]" />
                <span className="mt-4 block h-3.5 w-3/4 animate-pulse rounded bg-foreground/[0.06]" />
                <span className="mt-2 block h-3 w-1/2 animate-pulse rounded bg-foreground/[0.05]" />
              </div>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <div className="rounded-[10px] border border-border/60 bg-card">
            <EmptyState
              title="No uploads yet"
              body="Share an image or a note and the studio will pick it up from here."
              action={{ label: 'New upload', onClick: () => setDialogOpen(true) }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploads.map((upload) => {
              const status = UPLOAD_STATUS[upload.status || 'pending'] ?? UPLOAD_STATUS.pending;
              return (
                <button
                  type="button"
                  key={upload.id}
                  className="group overflow-hidden rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-primary/40 focus-visible:border-primary/60"
                  onClick={() => setSelectedUpload(upload)}
                >
                  {upload.image_url ? (
                    <div className="h-40 overflow-hidden border-b border-border/60">
                      <SecureImage
                        src={upload.image_url}
                        alt={upload.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center border-b border-border/60 bg-sunken">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 text-[13px] font-[550] text-foreground">{upload.title}</h4>
                    </div>
                    <div className="mt-1">
                      <RelativeTime date={upload.created_at} />
                    </div>
                    <div className="mt-2.5">
                      <StatusBadge tone={status.tone} label={status.label} />
                    </div>
                    {upload.notes && (
                      <p className="mt-2.5 line-clamp-2 text-[13px] text-muted-foreground">
                        {upload.notes}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload detail dialog */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="mx-4 max-w-lg overflow-hidden p-0 sm:mx-auto">
          {selectedUpload && (
            <>
              {selectedUpload.image_url && (
                <div className="relative h-56 w-full border-b border-border/60 sm:h-64">
                  <SecureImage
                    src={selectedUpload.image_url}
                    alt={selectedUpload.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">{selectedUpload.title}</h3>
                  <p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                    {format(new Date(selectedUpload.created_at), 'EEEE d MMMM yyyy')}
                  </p>
                </div>

                {(() => {
                  const status = UPLOAD_STATUS[selectedUpload.status || 'pending'] ?? UPLOAD_STATUS.pending;
                  return <StatusBadge tone={status.tone} label={status.label} />;
                })()}

                {selectedUpload.notes && (
                  <div className="pt-1">
                    <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes</p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{selectedUpload.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="h-8 flex-1 rounded-lg text-xs"
                    onClick={() => setSelectedUpload(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedUpload.id, selectedUpload.image_url)}
                    className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
