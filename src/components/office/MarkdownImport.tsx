import { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUp, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MarkdownImportProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (must come before inline code)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Headers
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links & images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    .replace(/^\*\*\*$/gm, '<hr />')
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Task lists
    .replace(/^- \[x\]\s+(.+)$/gm, '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">$1</li></ul>')
    .replace(/^- \[ \]\s+(.+)$/gm, '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">$1</li></ul>')
    // Unordered lists
    .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

  return html;
}

export function MarkdownImport({ editor, open, onOpenChange }: MarkdownImportProps) {
  const [mdContent, setMdContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(md|markdown|txt)$/i)) {
      toast.error('Please select a Markdown (.md) or text file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMdContent(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!mdContent.trim()) {
      toast.error('No content to import');
      return;
    }
    const html = markdownToHtml(mdContent);
    editor.chain().focus().insertContent(html).run();
    toast.success('Markdown imported successfully');
    setMdContent('');
    onOpenChange(false);
  };

  const handleReplaceAll = () => {
    if (!mdContent.trim()) return;
    const html = markdownToHtml(mdContent);
    editor.chain().focus().clearContent().insertContent(html).run();
    toast.success('Document replaced with imported Markdown');
    setMdContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setMdContent(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Import Markdown
          </DialogTitle>
          <DialogDescription className="text-[10px]">Import a .md file or paste Markdown content</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-1">
          <TabsList className="grid w-full grid-cols-3 h-8 rounded-lg">
            <TabsTrigger value="file" className="text-[11px] rounded-md gap-1.5">
              <Upload className="h-3 w-3" /> From File
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-[11px] rounded-md gap-1.5">
              <FileText className="h-3 w-3" /> Paste
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-[11px] rounded-md gap-1.5" disabled={!mdContent.trim()}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40 hover:bg-muted/30",
                mdContent && "border-primary/30 bg-primary/5"
              )}
            >
              {mdContent ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-primary mx-auto" />
                  <p className="text-xs font-medium">File loaded ({mdContent.split('\n').length} lines)</p>
                  <p className="text-[10px] text-muted-foreground">Click to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Drop a .md file or click to browse</p>
                  <p className="text-[10px] text-muted-foreground">Supports .md, .markdown, .txt files</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} className="hidden" />
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-3">
            <Textarea
              value={mdContent}
              onChange={(e) => setMdContent(e.target.value)}
              placeholder="Paste your Markdown content here…"
              className="min-h-[200px] text-xs font-mono rounded-lg resize-none"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div className="border border-border/30 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-auto bg-background">
              {mdContent.trim() ? (
                <>
                  {/* Import stats */}
                  <div className="flex gap-3 mb-3 pb-2 border-b border-border/20">
                    {[
                      { label: 'Lines', value: mdContent.split('\n').length },
                      { label: 'Words', value: mdContent.trim().split(/\s+/).length },
                      { label: 'Chars', value: mdContent.length },
                      { label: 'Headings', value: (mdContent.match(/^#{1,6}\s/gm) || []).length },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-[11px] font-bold tabular-nums">{s.value.toLocaleString()}</div>
                        <div className="text-[7px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-xs [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_code]:text-[10px] [&_pre]:text-[10px]"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(mdContent) }}
                  />
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-8">No content to preview</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2 gap-1">
          <Button variant="ghost" onClick={() => { setMdContent(''); onOpenChange(false); }} className="rounded-lg text-xs">Cancel</Button>
          <Button variant="outline" onClick={handleReplaceAll} disabled={!mdContent.trim()} className="rounded-lg text-xs">Replace All</Button>
          <Button onClick={handleImport} disabled={!mdContent.trim()} className="rounded-lg text-xs gap-1.5">
            <FileUp className="h-3 w-3" /> Insert at Cursor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
