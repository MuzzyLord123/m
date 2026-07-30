import { useEffect, useState } from 'react';
import { Phone, Smartphone, Mic, MicOff, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { VoiceMeter } from './VoiceMeter';
import { CallNoteEditor } from './QuickNotes';
import { OUTCOMES } from './callNotePresets';
import { useTranscription, speechRecognitionAvailable, TRANSCRIPT_STATUS_LABEL } from './useTranscription';
import type { EntityType } from '../useCRMData';

/**
 * The call console. Every Call press in the CRM comes through here and
 * is logged from the first second. With a paired phone the primary route
 * is "Call on your phone": the push rides realtime to the companion,
 * the handset rings the number, and the transcript the phone captures
 * streams back into this panel live. Calling on this device keeps the
 * local microphone transcription and voice meter. Never a raw tel: link
 * on desktop, so Windows Phone Link stays out of the flow.
 */

const FIELD_FOR: Record<EntityType, 'company_id' | 'contact_id' | 'opportunity_id'> = {
  company: 'company_id', contact: 'contact_id', opportunity: 'opportunity_id',
};

export function CallConsole({
  open,
  onOpenChange,
  number,
  entityType,
  entityId,
  entityName,
  orgId,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  number: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  orgId: string | null;
  onLogged?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState<'choose' | 'active'>('choose');
  const [source, setSource] = useState<'desktop' | 'phone'>('desktop');
  const [phoneLinked, setPhoneLinked] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [pushId, setPushId] = useState<string | null>(null);
  const [pushHandled, setPushHandled] = useState(false);
  const [remoteEnded, setRemoteEnded] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [phoneTranscript, setPhoneTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const speech = useTranscription();
  const transcript = speech.text;
  const interim = speech.interim;
  const listening = speech.running;

  const speechSupported = speechRecognitionAvailable();

  // Reset per open; check for a paired phone.
  useEffect(() => {
    if (!open) return;
    setPhase('choose'); setSource('desktop'); setCallId(null); setPushId(null); setPushHandled(false); setRemoteEnded(false);
    setStartedAt(null); setElapsed(0); setOutcome(null); setNotes('');
    speech.reset(''); speech.stop(); setPhoneTranscript('');
    let cancelled = false;
    supabase.from('crm_phone_links' as any)
      .select('id, claimed_at')
      .not('claimed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => { if (!cancelled) setPhoneLinked(((data as any[]) || []).length > 0); });
    return () => { cancelled = true; speech.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Call timer. Freezes at the phone's duration once the handset has
  // finished the call.
  useEffect(() => {
    if (phase !== 'active' || !startedAt || remoteEnded) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, startedAt, remoteEnded]);

  // Phone calls: watch the push being picked up, stream the transcript
  // the phone is writing into this panel, and notice when the handset
  // finishes the call so the desk only has to save the outcome.
  useEffect(() => {
    if (phase !== 'active' || source !== 'phone' || !callId) return;
    const id = setInterval(async () => {
      if (pushId && !pushHandled) {
        const { data } = await supabase.from('crm_call_pushes' as any)
          .select('handled_at').eq('id', pushId).limit(1);
        if (((data as any[]) || [])[0]?.handled_at) setPushHandled(true);
      }
      const { data: t } = await supabase.from('crm_call_transcripts' as any)
        .select('content').eq('call_id', callId).limit(1);
      const content = ((t as any[]) || [])[0]?.content;
      if (content) setPhoneTranscript(content);
      if (!remoteEnded) {
        const { data: log } = await supabase.from('crm_call_logs' as any)
          .select('ended_at, duration_seconds').eq('id', callId).limit(1);
        const row = ((log as any[]) || [])[0];
        if (row?.ended_at) {
          setRemoteEnded(true);
          if (typeof row.duration_seconds === 'number') setElapsed(row.duration_seconds);
        }
      }
    }, 2000);
    return () => clearInterval(id);
  }, [phase, source, callId, pushId, pushHandled, remoteEnded]);

  async function startCall(via: 'desktop' | 'phone') {
    if (!user || !orgId) { toast({ title: 'Missing organisation context', variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('crm_call_logs' as any).insert({
      org_id: orgId, admin_id: user.id,
      entity_type: entityType, entity_id: entityId, entity_name: entityName,
      phone: number, source: via,
    } as any).select('id').single();
    if (error) { toast({ title: 'Call not logged', description: error.message, variant: 'destructive' }); return; }
    const newCallId = (data as any).id as string;
    setCallId(newCallId);
    setSource(via);
    setStartedAt(Date.now());
    setPhase('active');
    if (via === 'phone') {
      const { data: push, error: pushErr } = await supabase.from('crm_call_pushes' as any).insert({
        user_id: user.id, phone: number, entity_type: entityType, entity_id: entityId,
        entity_name: entityName, call_id: newCallId,
      } as any).select('id').single();
      if (pushErr) toast({ title: 'Push failed', description: pushErr.message, variant: 'destructive' });
      else setPushId((push as any).id);
    } else {
      window.location.href = `tel:${number.replace(/\s+/g, '')}`;
    }
  }

  async function endCall() {
    if (!callId || !user) return;
    setSaving(true);
    speech.stop();
    const duration = remoteEnded ? elapsed : (startedAt ? Math.floor((Date.now() - startedAt) / 1000) : null);
    // If the phone already finished the call, its end time and duration
    // are the truth - only the outcome and notes are added here.
    await supabase.from('crm_call_logs' as any).update((remoteEnded
      ? { outcome, notes: notes.trim() || null }
      : {
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        outcome, notes: notes.trim() || null,
      }) as any).eq('id', callId);

    // Desktop calls own their local transcript; phone calls stream their
    // own row from the handset, which we never overwrite here.
    if (source === 'desktop' && transcript.trim()) {
      await supabase.from('crm_call_transcripts' as any).upsert({
        call_id: callId, admin_id: user.id, content: transcript.trim(), updated_at: new Date().toISOString(),
      } as any);
    }

    if (orgId) {
      const field = FIELD_FOR[entityType];
      await supabase.from('crm_communications').insert({
        org_id: orgId, owner_id: user.id,
        kind: 'call' as any, direction: 'outbound' as any,
        subject: `Call · ${OUTCOMES.find(o => o.value === outcome)?.label || 'logged'}`,
        body: notes.trim() || (source === 'phone' ? phoneTranscript.slice(0, 300) : transcript.slice(0, 300)) || null,
        occurred_at: new Date(startedAt || Date.now()).toISOString(),
        duration_seconds: duration,
        [field]: entityId,
      } as any);
    }

    setSaving(false);
    toast({ title: 'Call logged', description: 'Saved to this record and your call history.' });
    onOpenChange(false);
    onLogged?.();
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const label = 'font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]';

  const phoneButton = (
    <Button
      className="h-12 justify-start gap-3 rounded-[11px]"
      disabled={!phoneLinked}
      onClick={() => startCall('phone')}
    >
      <Smartphone className="h-4 w-4" />
      <span className="text-left">
        <span className="block text-[13px] font-medium">Call on your phone</span>
        <span className="block text-[10.5px] opacity-80">
          {phoneLinked ? 'Rings from your connected phone with a live transcript' : 'Connect a phone in Calls first'}
        </span>
      </span>
    </Button>
  );
  const desktopButton = (
    <Button
      variant={phoneLinked ? 'outline' : 'default'}
      className="h-12 justify-start gap-3 rounded-[11px]"
      onClick={() => startCall('desktop')}
    >
      <Phone className="h-4 w-4" />
      <span className="text-left">
        <span className="block text-[13px] font-medium">Call on this device</span>
        <span className="block text-[10.5px] text-muted-foreground">Uses this computer's calling app</span>
      </span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { if (!v) speech.stop(); onOpenChange(v); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" /> {entityName}
          </DialogTitle>
        </DialogHeader>

        {phase === 'choose' ? (
          <div className="space-y-3">
            <p className="font-mono text-[13px] tabular-nums">{number}</p>
            <div className="grid gap-2">
              {phoneLinked ? (<>{phoneButton}{desktopButton}</>) : (<>{desktopButton}{phoneButton}</>)}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The call is logged either way: timer, outcome, notes and the transcript, all saved to this record.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between rounded-[10px] border border-border/60 bg-sunken/50 px-4 py-3">
              <span className={label}>
                {source === 'phone'
                  ? (remoteEnded
                    ? 'Finished on your phone · save the outcome'
                    : pushHandled ? 'Ringing on your phone' : 'Sending to your phone…')
                  : 'On a call'}
              </span>
              <span className="font-mono text-[22px] font-semibold tabular-nums">{mm}:{ss}</span>
            </div>

            {source === 'phone' ? (
              <div>
                <span className={label}>Live transcript from your phone</span>
                <div className="mt-1.5 max-h-40 min-h-[72px] overflow-y-auto rounded-[10px] border border-border/60 p-3 text-[12.5px] leading-relaxed">
                  {phoneTranscript ? (
                    phoneTranscript
                  ) : (
                    <span className="text-muted-foreground">
                      {pushHandled
                        ? 'Waiting for speech. Put the call on speakerphone and keep the companion page open on your phone.'
                        : 'Open the companion page on your phone if it has not popped up.'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className={label}>Live transcript</span>
                  {speechSupported ? (
                    <button
                      type="button"
                      onClick={() => (listening ? speech.stop() : speech.start())}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
                        listening ? 'border-risk/50 text-risk' : 'border-border/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {listening ? TRANSCRIPT_STATUS_LABEL[speech.status] : 'Start'}
                    </button>
                  ) : (
                    <span className="text-[10.5px] text-muted-foreground">Not supported in this browser</span>
                  )}
                </div>
                <VoiceMeter active={listening} className="mt-2" />
                <div className="mt-1.5 max-h-32 min-h-[64px] overflow-y-auto rounded-[10px] border border-border/60 p-3 text-[12.5px] leading-relaxed">
                  {transcript || interim ? (
                    <>
                      {transcript}
                      {interim && <span className="text-muted-foreground"> {interim}</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {speech.status === 'blocked'
                        ? 'Microphone blocked for this site. Allow it in the padlock menu, then press Start again.'
                        : listening
                          ? 'Listening. Keep the call on speakerphone near this device.'
                          : 'Captures speech from this device’s microphone. Put the call on speakerphone near this device.'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <span className={label}>Outcome</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {OUTCOMES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOutcome(o.value)}
                    className={cn(
                      'h-8 rounded-lg border px-2.5 text-xs transition-colors',
                      outcome === o.value
                        ? 'border-primary/50 bg-primary/[0.08] text-primary'
                        : 'border-border/60 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={label}>Notes</span>
              <CallNoteEditor
                value={notes}
                onChange={setNotes}
                onOutcome={(o) => setOutcome(prev => prev ?? o)}
                className="mt-1.5"
              />
            </div>

            <Button className="h-11 w-full gap-2 rounded-[11px]" disabled={saving} onClick={endCall}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {remoteEnded ? 'Save outcome' : 'End call and save'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
