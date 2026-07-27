import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface Props {
  userId?: string;
  images: string[];
  onChange: (images: string[]) => void;
}

/**
 * Multi-image uploader for products.
 * Uploads to the private product-images bucket under {userId}/{uuid}.{ext},
 * then keeps a signed URL (30-day) in the product images array. Embed function
 * refreshes signed URLs at read time.
 */
export function ProductImageUploader({ userId, images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!userId) { toast.error('You must be signed in to upload'); return; }
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        if (file.size > 8 * 1024 * 1024) { toast.error(`${file.name} is over 8MB`); continue; }
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (error) { toast.error(error.message); continue; }
        const { data } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60 * 24 * 365);
        if (data?.signedUrl) uploaded.push(data.signedUrl);
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
      }
    } finally {
      setUploading(false);
    }
  }, [userId, images, onChange]);

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));
  const makePrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Product images</Label>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all p-4 text-center',
          dragOver ? 'border-brand bg-brand/[0.05]' : 'border-border/50 hover:border-border/70 bg-muted/20'
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={e => e.target.files && upload(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center gap-1.5 py-2 pointer-events-none">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-brand animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <p className="text-[13px] font-medium text-foreground">
            {uploading ? 'Uploading…' : 'Drop images or click to upload'}
          </p>
          <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP up to 8MB each</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] font-semibold uppercase tracking-wider bg-brand text-brand-foreground px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => makePrimary(i)}
                    className="h-7 w-7 rounded-md bg-white/90 hover:bg-white text-foreground flex items-center justify-center"
                    title="Make cover">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="h-7 w-7 rounded-md bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center"
                  title="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
          <ImageIcon className="h-3 w-3" /> First image becomes the cover. Drag to reorder or use the star icon.
        </p>
      )}
    </div>
  );
}
