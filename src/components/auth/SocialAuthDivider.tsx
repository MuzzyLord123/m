interface SocialAuthDividerProps {
  text?: string;
}

export function SocialAuthDivider({ text = 'or continue with' }: SocialAuthDividerProps) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-3 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}
