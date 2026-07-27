import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Loader2, ImageOff } from 'lucide-react';

interface SecureImageProps {
  src: string | null;
  alt: string;
  className?: string;
  bucket?: string;
  fallback?: React.ReactNode;
}

export default function SecureImage({ 
  src, 
  alt, 
  className = '', 
  bucket = 'customer-uploads',
  fallback
}: SecureImageProps) {
  const { signedUrl, loading } = useSignedUrl(src, bucket);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!signedUrl) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <ImageOff className="w-8 h-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
    />
  );
}
