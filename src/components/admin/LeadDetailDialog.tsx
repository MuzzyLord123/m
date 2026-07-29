import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Phone, Mail, Globe, MapPin, Star, Building, User,
  MessageSquare, Clock, ChevronLeft, ChevronRight, X, ExternalLink,
  UserPlus, Save, Trash2, Tag, History, ArrowRight, Loader2, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Lead, LeadNote, AdminUser, leadStatusConfig, sourceLabels } from './AdminLeadManagement';

interface LeadDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  leads: Lead[];
  adminUsers: AdminUser[];
  onLeadChange: (lead: Lead) => void;
  onUpdate: () => void;
}

interface StatusHistoryEntry {
  id: string;
  old_status: Lead['status'] | null;
  new_status: Lead['status'];
  changed_at: string;
  changed_by: string;
  changer_name?: string;
}

export default function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  leads,
  adminUsers,
  onLeadChange,
  onUpdate,
}: LeadDetailDialogProps) {
  const { user } = useAuth();
  const [editedLead, setEditedLead] = useState<Lead | null>(lead);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isNewLead, setIsNewLead] = useState(false);
  const [converting, setConverting] = useState(false);

  // Reset state when lead changes - optimized to not fetch notes/history immediately
  useEffect(() => {
    if (lead) {
      setEditedLead(lead);
      setIsNewLead(false);
      setActiveTab('details');
      // Clear old data immediately for faster perceived performance
      setNotes([]);
      setStatusHistory([]);
    } else {
      // New lead mode
      setEditedLead({
        id: '',
        business_name: null,
        personal_name: null,
        contact_name: null,
        is_personal: false,
        phone: null,
        email: null,
        website_url: null,
        location_city: null,
        location_postcode: null,
        google_rating: null,
        review_count: 0,
        category: null,
        source: 'manual',
        status: 'new',
        assigned_to: null,
        last_contacted_at: null,
        tags: [],
        converted_client_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsNewLead(true);
      setNotes([]);
      setStatusHistory([]);
    }
  }, [lead, open]);

  // Lazy load notes and history only when tab is switched
  useEffect(() => {
    if (!lead?.id || isNewLead) return;
    
    if (activeTab === 'notes' && notes.length === 0) {
      fetchNotes(lead.id);
    } else if (activeTab === 'history' && statusHistory.length === 0) {
      fetchStatusHistory(lead.id);
    }
  }, [activeTab, lead?.id, isNewLead]);

  const fetchNotes = async (leadId: string) => {
    setLoadingNotes(true);
    const { data } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (data) {
      // Get author names
      const authorIds = [...new Set(data.map(n => n.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setNotes(data.map(n => ({ ...n, author_name: profileMap.get(n.author_id) || 'Unknown' })));
    }
    setLoadingNotes(false);
  };

  const fetchStatusHistory = async (leadId: string) => {
    const { data } = await supabase
      .from('lead_status_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('changed_at', { ascending: false });

    if (data) {
      const changerIds = [...new Set(data.map(h => h.changed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', changerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setStatusHistory(data.map(h => ({ ...h, changer_name: profileMap.get(h.changed_by) || 'Unknown' })));
    }
  };

  // Navigation
  const currentIndex = leads.findIndex(l => l.id === lead?.id);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < leads.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      onLeadChange(leads[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onLeadChange(leads[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || isNewLead) return;
      if (e.key === 'ArrowLeft' && canGoPrev) handlePrev();
      if (e.key === 'ArrowRight' && canGoNext) handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, isNewLead, canGoPrev, canGoNext]);

  // Save lead
  const handleSave = async () => {
    if (!editedLead || !user) return;
    setSaving(true);

    try {
      if (isNewLead) {
        // Create new lead
        const { data, error } = await supabase
          .from('leads')
          .insert({
            business_name: editedLead.business_name,
            personal_name: editedLead.personal_name,
            contact_name: editedLead.contact_name,
            is_personal: editedLead.is_personal,
            phone: editedLead.phone,
            email: editedLead.email,
            website_url: editedLead.website_url,
            location_city: editedLead.location_city,
            location_postcode: editedLead.location_postcode,
            google_rating: editedLead.google_rating,
            review_count: editedLead.review_count,
            category: editedLead.category,
            source: 'manual',
            status: 'new',
            assigned_to: editedLead.assigned_to,
            tags: editedLead.tags,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Lead created');
        onUpdate();
        onOpenChange(false);
      } else {
        // Update existing lead
        const oldStatus = lead?.status;
        const { error } = await supabase
          .from('leads')
          .update({
            business_name: editedLead.business_name,
            personal_name: editedLead.personal_name,
            contact_name: editedLead.contact_name,
            is_personal: editedLead.is_personal,
            phone: editedLead.phone,
            email: editedLead.email,
            website_url: editedLead.website_url,
            location_city: editedLead.location_city,
            location_postcode: editedLead.location_postcode,
            google_rating: editedLead.google_rating,
            review_count: editedLead.review_count,
            category: editedLead.category,
            status: editedLead.status,
            assigned_to: editedLead.assigned_to,
            tags: editedLead.tags,
            last_contacted_at: editedLead.status === 'contacted' && oldStatus !== 'contacted' 
              ? new Date().toISOString() 
              : editedLead.last_contacted_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editedLead.id);

        if (error) throw error;

        // Log status change if changed
        if (oldStatus && editedLead.status !== oldStatus) {
          await supabase.from('lead_status_history').insert({
            lead_id: editedLead.id,
            changed_by: user.id,
            old_status: oldStatus,
            new_status: editedLead.status,
          });
        }

        toast.success('Lead updated');
        onUpdate();
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save lead');
    }
    setSaving(false);
  };

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim() || !editedLead?.id || !user) return;

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: editedLead.id,
      author_id: user.id,
      content: newNote.trim(),
    });

    if (error) {
      toast.error('Failed to add note');
    } else {
      setNewNote('');
      fetchNotes(editedLead.id);
      toast.success('Note added');
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
    if (error) {
      toast.error('Failed to delete note');
    } else {
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    }
  };

  // Delete lead
  const handleDelete = async () => {
    if (!editedLead?.id) return;
    const { error } = await supabase.from('leads').delete().eq('id', editedLead.id);
    if (error) {
      toast.error('Failed to delete lead');
    } else {
      toast.success('Lead deleted');
      onUpdate();
      onOpenChange(false);
    }
  };

  // Convert to client
  const handleConvertToClient = async () => {
    if (!editedLead || !user) return;
    setConverting(true);

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      
      // Call the create-client edge function
      const response = await supabase.functions.invoke('create-client', {
        body: {
          email: editedLead.email || `lead-${editedLead.id.slice(0, 8)}@placeholder.com`,
          password: tempPassword,
          fullName: editedLead.contact_name || editedLead.business_name || editedLead.personal_name || 'New Client',
          company: editedLead.business_name || '',
          phone: editedLead.phone || '',
          plan: 'Preview Only',
          websiteStatus: 'design',
        },
      });

      if (response.error) throw response.error;

      const { userId: newClientId } = response.data;

      // Update lead with converted client ID
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_client_id: newClientId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editedLead.id);

      // Copy notes to client
      if (notes.length > 0) {
        const noteSummary = notes.map(n => 
          `[${format(new Date(n.created_at), 'MMM d, yyyy')}] ${n.content}`
        ).join('\n\n');

        await supabase
          .from('profiles')
          .update({ notes: `Lead notes:\n${noteSummary}` })
          .eq('user_id', newClientId);
      }

      // Log status change
      await supabase.from('lead_status_history').insert({
        lead_id: editedLead.id,
        changed_by: user.id,
        old_status: editedLead.status,
        new_status: 'converted',
      });

      toast.success('Lead converted to client successfully');
      onUpdate();
      onOpenChange(false);
    } catch (err) {
      console.error('Conversion error:', err);
      toast.error('Failed to convert lead to client');
    }
    setConverting(false);
  };

  // Get assigned user name
  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const admin = adminUsers.find(a => a.user_id === userId);
    return admin?.full_name || admin?.email || 'Unknown';
  };

  if (!editedLead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  "text-sm font-medium",
                  editedLead.is_personal ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"
                )}>
                  {(editedLead.business_name || editedLead.personal_name || 'L').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-lg">
                  {editedLead.business_name || editedLead.personal_name || editedLead.contact_name || 'New Lead'}
                </span>
                {editedLead.category && (
                  <p className="text-sm text-muted-foreground font-normal">{editedLead.category}</p>
                )}
              </div>
            </DialogTitle>
            
            {/* Navigation */}
            {!isNewLead && leads.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {leads.length}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleNext}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x flex-1 min-h-0 overflow-hidden">
          {/* Left Panel - Details */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
              <TabsList className="mx-6 mt-4 mb-2 flex-shrink-0">
                <TabsTrigger value="details">Details</TabsTrigger>
                {editedLead.enquiry_data && (
                  <TabsTrigger value="enquiry">Enquiry</TabsTrigger>
                )}
                <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 min-h-0">
                <TabsContent value="details" className="m-0 px-6 pb-6 space-y-4">
                  {/* Status */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Object.keys(leadStatusConfig) as Lead['status'][]).map((status) => (
                        <Button
                          key={status}
                          variant={editedLead.status === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditedLead({ ...editedLead, status })}
                          className={cn(
                            "text-xs",
                            editedLead.status === status && leadStatusConfig[status].bgColor
                          )}
                        >
                          {leadStatusConfig[status].label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Business Name</Label>
                      <Input
                        value={editedLead.business_name || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, business_name: e.target.value || null })}
                        placeholder="Business name"
                      />
                    </div>
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={editedLead.contact_name || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, contact_name: e.target.value || null })}
                        placeholder="Contact person"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editedLead.phone || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value || null })}
                        placeholder="+44 7700 900000"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editedLead.email || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value || null })}
                        placeholder="email@business.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Website</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editedLead.website_url || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, website_url: e.target.value || null })}
                          placeholder="https://example.com"
                        />
                        {editedLead.website_url && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => window.open(editedLead.website_url!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={editedLead.location_city || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, location_city: e.target.value || null })}
                        placeholder="London"
                      />
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input
                        value={editedLead.location_postcode || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, location_postcode: e.target.value || null })}
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={editedLead.category || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, category: e.target.value || null })}
                        placeholder="Restaurant, Plumber, etc."
                      />
                    </div>
                    <div>
                      <Label>Google Rating</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={editedLead.google_rating || ''}
                          onChange={(e) => setEditedLead({ 
                            ...editedLead, 
                            google_rating: e.target.value ? parseFloat(e.target.value) : null 
                          })}
                          placeholder="4.5"
                          className="w-24"
                        />
                        {editedLead.google_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-gold text-gold" />
                            <span className="text-sm">{editedLead.google_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Assignment */}
                  <div>
                    <Label>Assigned To</Label>
                    <Select
                      value={editedLead.assigned_to || 'unassigned'}
                      onValueChange={(v) => setEditedLead({ ...editedLead, assigned_to: v === 'unassigned' ? null : v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {adminUsers.map(admin => (
                          <SelectItem key={admin.user_id} value={admin.user_id}>
                            {admin.full_name || admin.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Meta info */}
                  {!isNewLead && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Source: {sourceLabels[editedLead.source]}</p>
                      <p>Created: {format(new Date(editedLead.created_at), 'MMM d, yyyy h:mm a')}</p>
                      {editedLead.last_contacted_at && (
                        <p>Last Contacted: {format(new Date(editedLead.last_contacted_at), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                  )}
                </TabsContent>

                {editedLead.enquiry_data && (
                  <TabsContent value="enquiry" className="m-0 px-6 pb-6 space-y-4">
                    <div className="flex items-center gap-2 pt-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Original Enquiry Submission</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All information submitted by the customer when they enquired.
                    </p>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {Object.entries(editedLead.enquiry_data)
                        .filter(([key, value]) => {
                          if (value === null || value === undefined || value === '') return false;
                          if (['id', 'status', 'notes', 'created_at', 'updated_at'].includes(key)) return false;
                          if (Array.isArray(value) && value.length === 0) return false;
                          return true;
                        })
                        .map(([key, value]) => {
                          const label = key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase());
                          const displayValue = Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : String(value);
                          const isLong = displayValue.length > 60;
                          return (
                            <div
                              key={key}
                              className={cn(
                                'rounded-lg border border-border/40 bg-muted/30 p-3',
                                isLong && 'sm:col-span-2'
                              )}
                            >
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                {label}
                              </div>
                              <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                                {displayValue}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="notes" className="m-0 px-6 pb-6 space-y-4">
                  {/* Add note */}
                  {!isNewLead && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-20"
                      />
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!newNote.trim()}
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  )}

                  {/* Notes list */}
                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="p-3 rounded-lg bg-muted/50 border group">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{note.author_name}</span>
                            <span>•</span>
                            <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="m-0 px-6 pb-6">
                  {statusHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No status changes recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {statusHistory.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {entry.old_status && (
                                <>
                                  <Badge variant="outline" className={cn(
                                    "text-xs",
                                    leadStatusConfig[entry.old_status]?.bgColor
                                  )}>
                                    {leadStatusConfig[entry.old_status]?.label}
                                  </Badge>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                </>
                              )}
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                leadStatusConfig[entry.new_status]?.bgColor
                              )}>
                                {leadStatusConfig[entry.new_status]?.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.changer_name} • {format(new Date(entry.changed_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right Panel - Actions */}
          <ScrollArea className="w-full lg:w-72 flex-shrink-0">
            <div className="p-4 lg:p-6 space-y-4 bg-muted/30">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isNewLead ? 'Create Lead' : 'Save Changes'}
                </>
              )}
            </Button>

            {!isNewLead && editedLead.status !== 'converted' && (
              <>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleConvertToClient}
                  disabled={converting}
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Convert to Client
                    </>
                  )}
                </Button>
              </>
            )}

            {editedLead.converted_client_id && (
              <div className="p-3 rounded-lg bg-ok/10 border border-ok/30">
                <p className="text-sm text-ok font-medium">Converted to client</p>
              </div>
            )}

            {!isNewLead && (
              <>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Lead
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this lead? This action cannot be undone.
                        All notes and history will also be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {/* Quick Info */}
            {!isNewLead && (
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Info
                </h4>
                {editedLead.phone && (
                  <a 
                    href={`tel:${editedLead.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {editedLead.phone}
                  </a>
                )}
                {editedLead.email && (
                  <a 
                    href={`mailto:${editedLead.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors truncate"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{editedLead.email}</span>
                  </a>
                )}
                {editedLead.location_city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {editedLead.location_city}
                    {editedLead.location_postcode && `, ${editedLead.location_postcode}`}
                  </div>
                )}
              </div>
            )}
          </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
