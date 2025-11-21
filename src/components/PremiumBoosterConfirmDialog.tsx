import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useI18n } from "@/i18n";

interface PremiumBoosterConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PremiumBoosterConfirmDialog({
  open,
  onOpenChange,
  onConfirm
}: PremiumBoosterConfirmDialogProps) {
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(false);

  const handleConfirm = () => {
    if (accepted) {
      onConfirm();
      onOpenChange(false);
      setAccepted(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-purple-900/95 border-2 border-yellow-500/30 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('premium.dialog_title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-200 space-y-4">
            <p className="text-base leading-relaxed">
              {t('premium.dialog_description')}
            </p>
            
            <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-gray-300">
                {t('premium.instant_credit')}
              </p>
            </div>

            <p className="text-sm text-gray-300">
              {t('premium.future_purchases')}
            </p>

            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="accept-terms"
                className="text-sm text-gray-200 cursor-pointer leading-snug"
              >
                {t('premium.accept_terms')}
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">
            {t('premium.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!accepted}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('premium.accept_purchase')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
