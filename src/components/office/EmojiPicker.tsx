import { useState, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';

const EMOJI_DATA: { cat: string; icon: string; emojis: string[] }[] = [
  { cat: 'Smileys', icon: '😀', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'] },
  { cat: 'Gestures', icon: '👋', emojis: ['👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'] },
  { cat: 'People', icon: '👤', emojis: ['👶','👧','🧒','👦','👩','🧑','👨','👩‍🦱','🧑‍🦱','👨‍🦱','👩‍🦰','🧑‍🦰','👨‍🦰','👱‍♀️','👱','👱‍♂️','👩‍🦳','🧑‍🦳','👨‍🦳','👩‍🦲','🧑‍🦲','👨‍🦲','🧔‍♀️','🧔','🧔‍♂️','👵','🧓','👴'] },
  { cat: 'Nature', icon: '🌿', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕'] },
  { cat: 'Food', icon: '🍎', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥖','🍞','🥨','🥯','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓'] },
  { cat: 'Objects', icon: '💡', emojis: ['⌚','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷'] },
  { cat: 'Symbols', icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','✅','❌','❓','❗','‼️','⁉️'] },
  { cat: 'Flags', icon: '🏁', emojis: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇪🇸','🇮🇹','🇯🇵','🇰🇷','🇨🇳','🇧🇷','🇮🇳','🇷🇺','🇦🇺','🇨🇦','🇲🇽','🇦🇷','🇸🇦','🇦🇪','🇹🇷','🇵🇱','🇳🇱','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇨🇭','🇦🇹','🇧🇪','🇵🇹','🇬🇷','🇮🇪','🇳🇿'] },
];

interface EmojiPickerProps {
  editor: Editor;
}

const SKIN_TONES = [
  { label: 'Default', mod: '', preview: '👋' },
  { label: 'Light', mod: '🏻', preview: '👋🏻' },
  { label: 'Medium-Light', mod: '🏼', preview: '👋🏼' },
  { label: 'Medium', mod: '🏽', preview: '👋🏽' },
  { label: 'Medium-Dark', mod: '🏾', preview: '👋🏾' },
  { label: 'Dark', mod: '🏿', preview: '👋🏿' },
];

export function EmojiPicker({ editor }: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(EMOJI_DATA[0].cat);
  const [skinTone, setSkinTone] = useState(() => {
    try { return localStorage.getItem('doc_emoji_skin') || ''; } catch { return ''; }
  });
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('doc_recent_emojis') || '[]');
    } catch { return []; }
  });

  const filteredEmojis = useMemo(() => {
    if (!search) return null;
    return EMOJI_DATA.flatMap(c => c.emojis).filter(e => e.includes(search));
  }, [search]);

  const applyTone = (emoji: string) => {
    if (!skinTone) return emoji;
    // Only apply to single-codepoint emojis that support skin tone
    const cp = [...emoji];
    if (cp.length === 1) return emoji + skinTone;
    return emoji;
  };

  // Track usage frequency
  const [emojiUsage, setEmojiUsage] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('doc_emoji_usage') || '{}'); } catch { return {}; }
  });

  const topEmojis = useMemo(() => {
    return Object.entries(emojiUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([e]) => e);
  }, [emojiUsage]);

  const insertEmoji = (emoji: string) => {
    const toned = applyTone(emoji);
    editor.chain().focus().insertContent(toned).run();
    const updated = [toned, ...recentEmojis.filter(e => e !== toned)].slice(0, 24);
    setRecentEmojis(updated);
    localStorage.setItem('doc_recent_emojis', JSON.stringify(updated));
    const newUsage = { ...emojiUsage, [toned]: (emojiUsage[toned] || 0) + 1 };
    setEmojiUsage(newUsage);
    try { localStorage.setItem('doc_emoji_usage', JSON.stringify(newUsage)); } catch {}
  };

  const handleSkinTone = (mod: string) => {
    setSkinTone(mod);
    try { localStorage.setItem('doc_emoji_skin', mod); } catch {}
  };

  const displayEmojis = filteredEmojis || EMOJI_DATA.find(c => c.cat === activeCat)?.emojis || [];

  return (
    <Popover>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-[28px] w-[28px] rounded-[6px]">
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1 rounded-md">Emoji</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-0 rounded-xl shadow-xl border-border/50" align="start">
        {/* Search */}
        <div className="p-2 border-b border-border/30">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji…"
            className="h-7 text-[10px] rounded-lg"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex items-center px-1.5 pt-1 gap-0.5 border-b border-border/20">
            {EMOJI_DATA.map(c => (
              <button
                key={c.cat}
                onClick={() => setActiveCat(c.cat)}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-md text-sm transition-colors",
                  activeCat === c.cat ? "bg-primary/10" : "hover:bg-muted/60"
                )}
                title={c.cat}
              >
                {c.icon}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-px">
              {SKIN_TONES.map(t => (
                <button
                  key={t.mod}
                  onClick={() => handleSkinTone(t.mod)}
                  className={cn(
                    "h-5 w-5 rounded-full text-[10px] flex items-center justify-center transition-all",
                    skinTone === t.mod ? "ring-1 ring-primary scale-110" : "hover:scale-110"
                  )}
                  title={t.label}
                >
                  {t.mod ? `✋${t.mod}` : '✋'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Most Used */}
        {!search && topEmojis.length > 0 && activeCat === EMOJI_DATA[0].cat && (
          <div className="px-2 pt-2">
            <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Most Used</p>
            <div className="flex flex-wrap gap-0.5">
              {topEmojis.map((e, i) => (
                <button key={`top-${i}`} onClick={() => insertEmoji(e)} className="h-7 w-7 flex items-center justify-center rounded-md text-base hover:bg-primary/10 transition-colors relative">
                  {e}
                  <span className="absolute -top-0.5 -right-0.5 text-[6px] font-bold text-muted-foreground/40 tabular-nums">{emojiUsage[e]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {!search && recentEmojis.length > 0 && activeCat === EMOJI_DATA[0].cat && (
          <div className="px-2 pt-1">
            <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Recent</p>
            <div className="flex flex-wrap gap-0.5">
              {recentEmojis.map((e, i) => (
                <button key={`recent-${i}`} onClick={() => insertEmoji(e)} className="h-7 w-7 flex items-center justify-center rounded-md text-base hover:bg-primary/10 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emoji grid */}
        <ScrollArea className="h-52">
          <div className="p-2">
            {!search && <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">{activeCat}</p>}
            <div className="grid grid-cols-9 gap-0.5">
              {displayEmojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => insertEmoji(emoji)}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-base hover:bg-primary/10 hover:scale-125 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
