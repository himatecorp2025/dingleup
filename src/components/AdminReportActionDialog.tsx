import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AdminReportActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    id: string;
    reporter_id: string;
    report_type: string;
    bug_category?: string;
    bug_description?: string;
    violation_type?: string;
    violation_description?: string;
    reported_user?: { username: string };
    reporter?: { username: string; email: string };
  };
  actionType: 'reviewing' | 'resolved' | 'dismissed';
  onSuccess: () => void;
}

// Problem types - now using i18n keys
const getProblemTypes = (t: (key: string) => string) => [
  t('admin.report.problem_game_crash'),
  t('admin.report.problem_question_display'),
  t('admin.report.problem_correct_marked_wrong'),
  t('admin.report.problem_wrong_marked_correct'),
  t('admin.report.problem_timer'),
  t('admin.report.problem_coins_life_not_credited'),
  t('admin.report.problem_booster_not_activated'),
  t('admin.report.problem_reward_not_received'),
  t('admin.report.problem_chat_message_cant_send'),
  t('admin.report.problem_media_upload'),
  t('admin.report.problem_friend_add'),
  t('admin.report.problem_leaderboard_not_updating'),
  t('admin.report.problem_payment'),
  t('admin.report.problem_login'),
  t('admin.report.problem_mobile_display'),
  t('admin.report.problem_technical_other'),
  t('admin.report.problem_performance'),
  t('admin.report.problem_sync')
];

// Dismissal reasons - now using i18n keys
const getDismissalReasons = (t: (key: string) => string) => [
  t('admin.report.dismiss_not_reproducible'),
  t('admin.report.dismiss_device_specific'),
  t('admin.report.dismiss_browser_specific'),
  t('admin.report.dismiss_already_fixed'),
  t('admin.report.dismiss_intended_behavior'),
  t('admin.report.dismiss_duplicate'),
  t('admin.report.dismiss_user_error'),
  t('admin.report.dismiss_internet_connection'),
  t('admin.report.dismiss_storage'),
  t('admin.report.dismiss_battery'),
  t('admin.report.dismiss_outdated_version'),
  t('admin.report.dismiss_permissions'),
  t('admin.report.dismiss_no_violation'),
  t('admin.report.dismiss_insufficient_evidence'),
  t('admin.report.dismiss_misunderstanding'),
  t('admin.report.dismiss_no_context'),
  t('admin.report.dismiss_protected_conversation'),
  t('admin.report.dismiss_out_of_scope'),
  t('admin.report.dismiss_automated_message'),
  t('admin.report.dismiss_joke'),
  t('admin.report.dismiss_language_difference'),
  t('admin.report.dismiss_mutual_agreement')
];

// Action config - now using i18n keys
const getActionConfig = (t: (key: string) => string) => ({
  reviewing: {
    title: t('admin.report.action_reviewing_title'),
    description: t('admin.report.action_reviewing_desc'),
    buttonText: t('admin.report.action_reviewing_button'),
    buttonClass: 'bg-primary hover:bg-primary/90',
    defaultMessage: t('admin.report.action_reviewing_default_msg')
  },
  resolved: {
    title: t('admin.report.action_resolved_title'),
    description: t('admin.report.action_resolved_desc'),
    buttonText: t('admin.report.action_resolved_button'),
    buttonClass: 'bg-success hover:bg-success/90',
    defaultMessage: t('admin.report.action_resolved_default_msg')
  },
  dismissed: {
    title: t('admin.report.action_dismissed_title'),
    description: t('admin.report.action_dismissed_desc'),
    buttonText: t('admin.report.action_dismissed_button'),
    buttonClass: 'bg-destructive hover:bg-destructive/90',
    defaultMessage: t('admin.report.action_dismissed_default_msg')
  }
});

export const AdminReportActionDialog = ({ 
  open, 
  onOpenChange, 
  report,
  actionType,
  onSuccess 
}: AdminReportActionDialogProps) => {
  const { t } = useI18n();
  const actionConfig = getActionConfig(t);
  const [message, setMessage] = useState(actionConfig[actionType].defaultMessage);
  const [submitting, setSubmitting] = useState(false);
  const [reasonType, setReasonType] = useState<string>('');
  const [customReasonType, setCustomReasonType] = useState<string>('');
  const [availableReasonTypes, setAvailableReasonTypes] = useState<string[]>(
    actionType === 'resolved' ? getProblemTypes(t) : getDismissalReasons(t)
  );

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setMessage(actionConfig[actionType].defaultMessage);
      setReasonType('');
      setCustomReasonType('');
      setAvailableReasonTypes(actionType === 'resolved' ? getProblemTypes(t) : getDismissalReasons(t));
    }
  }, [open, actionType, t]);

  const handleAddCustomReasonType = () => {
    if (customReasonType.trim() && !availableReasonTypes.includes(customReasonType.trim())) {
      const newType = customReasonType.trim();
      setAvailableReasonTypes([...availableReasonTypes, newType]);
      setReasonType(newType);
      setCustomReasonType('');
      toast.success(actionType === 'resolved' ? t('admin.new_problem_added') : t('admin.new_dismissal_added'));
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t('admin.field_required'));
      return;
    }

    if (message.length < 10) {
      toast.error(t('admin.message_too_short'));
      return;
    }

    if (message.length > 2000) {
      toast.error(t('admin.message_too_long'));
      return;
    }

    if ((actionType === 'resolved' || actionType === 'dismissed') && !reasonType) {
      toast.error(actionType === 'resolved' 
        ? t('admin.select_problem_type') 
        : t('admin.select_dismissal_reason'));
      return;
    }

    // Ensure valid admin session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error(t('admin.session_expired'));
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) {
        toast.error(t('admin.no_session'));
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-send-report-notification', {
        body: {
          reporterId: report.reporter_id,
          message: message.trim(),
          reportId: report.id,
          newStatus: actionType,
          reasonType: reasonType || null,
          reportDetails: {
            reportType: report.report_type,
            bugCategory: report.bug_category,
            bugDescription: report.bug_description,
            violationType: report.violation_type,
            violationDescription: report.violation_description,
            reportedUsername: report.reported_user?.username,
            reporterUsername: report.reporter?.username,
            reporterEmail: report.reporter?.email
          }
        },
        headers: { Authorization: `Bearer ${adminSession.access_token}` }
      });

      if (error) {
        console.error('[AdminAction] Error:', error);
        throw error;
      }


      const actionLabel = {
        reviewing: t('admin.status_reviewing'),
        resolved: t('admin.status_resolved'),
        dismissed: t('admin.status_dismissed')
      }[actionType];

      toast.success(t('admin.report_action_success').replace('{status}', actionLabel));
      onOpenChange(false);
      onSuccess();
      setMessage(actionConfig[actionType].defaultMessage);
      setReasonType('');
      setCustomReasonType('');
    } catch (error: any) {
      console.error('[AdminAction] Fatal error:', error);
      const status = error?.status || error?.context?.status;
      const msg: string = error?.message || '';
      if (status === 401 || status === 403 || /authorization|token/i.test(msg)) {
        toast.error(t('admin.session_expired'));
      } else if (/function returned non-?2xx/i.test(msg)) {
        toast.error(t('admin.send_error'));
      } else {
        toast.error(t('admin.error_with_message').replace('{message}', msg || t('admin.unknown_error')));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const config = actionConfig[actionType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-[hsl(var(--primary-dark))] to-[hsl(var(--primary-darker))] border-2 border-accent/50 text-foreground z-[9999]"
        style={{
          maxWidth: 'clamp(320px, 90vw, 500px)',
          padding: 'clamp(0.75rem, 3vw, 1rem)'
        }}
      >
        <DialogHeader style={{ marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <DialogTitle className="font-black text-accent"
            style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)' }}
          >
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-foreground/80"
            style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <div>
            <Label className="text-base text-accent mb-2 block font-bold">
              {t('admin.report.reason_label')} {actionType === 'reviewing' ? t('admin.report.reason_reviewing_suffix') : actionType === 'resolved' ? t('admin.report.reason_resolved_suffix') : t('admin.report.reason_dismissed_suffix')}?
            </Label>
            <p className="text-xs text-foreground/70 mb-2">
              {t('admin.report.reason_explain')}
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                actionType === 'reviewing' 
                  ? t('admin.report.placeholder_reviewing') 
                  : actionType === 'resolved'
                  ? t('admin.report.placeholder_resolved')
                  : t('admin.report.placeholder_dismissed')
              }
              className="min-h-[140px] bg-muted/80 border-2 border-accent/50 text-foreground text-sm resize-none focus:border-accent"
              maxLength={2000}
              autoFocus
            />
            <p className="text-xs text-foreground/50 mt-1">
              {message.length} / 2000 {t('admin.report.char_count')} {message.length < 10 && message.length > 0 ? t('admin.report.too_short') : ''}
            </p>
          </div>

          {/* Reason Type Selector - For resolved and dismissed status */}
          {(actionType === 'resolved' || actionType === 'dismissed') && (
            <div>
              <Label className="text-base text-accent mb-2 block font-bold">
                {actionType === 'resolved' ? t('admin.report.problem_type_label') : t('admin.report.dismissal_reason_label')}
              </Label>
              <p className="text-xs text-foreground/70 mb-2">
                {actionType === 'resolved' 
                  ? t('admin.report.select_problem_desc')
                  : t('admin.report.select_dismissal_desc')}
              </p>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger className="bg-muted/80 border-2 border-accent/50 text-foreground focus:border-accent">
                  <SelectValue placeholder={actionType === 'resolved' ? t('admin.report.select_problem_placeholder') : t('admin.report.select_dismissal_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-muted border-accent/50 text-foreground max-h-[300px] z-[10000]">
                  {availableReasonTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-foreground hover:bg-accent/20">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Reason Type Input */}
              <div className="mt-3 p-3 bg-muted/50 border border-accent/30 rounded-lg">
                <Label className="text-sm text-foreground/90 mb-2 block">
                  {actionType === 'resolved' ? t('admin.report.add_custom_problem') : t('admin.report.add_custom_dismissal')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={customReasonType}
                    onChange={(e) => setCustomReasonType(e.target.value)}
                    placeholder={actionType === 'resolved' ? t('admin.report.input_custom_problem') : t('admin.report.input_custom_dismissal')}
                    className="flex-1 bg-muted/80 border-primary/50 text-foreground text-sm"
                    maxLength={100}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomReasonType();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomReasonType}
                    disabled={!customReasonType.trim()}
                    className="bg-success hover:bg-success/90 text-foreground whitespace-nowrap text-sm"
                  >
                    {t('admin.report.add_button')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 text-foreground font-bold h-9 text-sm ${config.buttonClass}`}
            >
              {submitting ? t('admin.report.sending') : config.buttonText}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              variant="outline"
              className="bg-muted hover:bg-muted/80 border-border text-foreground h-9 text-sm"
            >
              {t('admin.report.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
