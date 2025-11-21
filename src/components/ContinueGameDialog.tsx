import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Clock, X } from "lucide-react";
import { useI18n } from "@/i18n";

interface ContinueGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'timeout' | 'wrong' | 'out-of-lives';
  cost: number;
  currentCoins: number;
  onContinue: () => void;
  onExit: () => void;
  onNeedCoins?: () => void;
}

export const ContinueGameDialog = ({
  open,
  onOpenChange,
  type,
  cost,
  currentCoins,
  onContinue,
  onExit,
  onNeedCoins
}: ContinueGameDialogProps) => {
  const { t } = useI18n();
  const canAfford = currentCoins >= cost;

  const getTitle = () => {
    switch (type) {
      case 'timeout':
        return t('game.continue.timeout_title');
      case 'wrong':
        return t('game.continue.wrong_title');
      case 'out-of-lives':
        return t('game.continue.out_of_lives_title');
      default:
        return t('game.continue.default_title');
    }
  };

  const getDescription = () => {
    if (!canAfford) {
      return t('game.continue.no_coins_description');
    }
    return t('game.continue.description').replace('{cost}', cost.toString());
  };

  const getIcon = () => {
    switch (type) {
      case 'timeout':
        return <Clock className="w-6 h-6 text-accent" />;
      case 'wrong':
        return <X className="w-6 h-6 text-destructive" />;
      case 'out-of-lives':
        return <span className="text-3xl">💔</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md bg-gradient-to-br from-[hsl(var(--primary-dark))] to-[hsl(var(--primary-darker))] border-2 border-primary/50 text-foreground p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-foreground/80 pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-3 sm:mt-4">
          {canAfford ? (
            <Button 
              onClick={onContinue} 
              className="w-full gap-1.5 sm:gap-2 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-foreground text-sm sm:text-base py-2 sm:py-2.5"
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('game.continue.continue_button').replace('{cost}', cost.toString())}
            </Button>
          ) : (
            <Button 
              onClick={() => onNeedCoins?.()} 
              className="w-full gap-1.5 sm:gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold text-sm sm:text-base py-2 sm:py-2.5"
            >
              {t('game.continue.shop_button')}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onExit} 
            className="w-full border-border/30 text-foreground hover:bg-accent/10 text-sm sm:text-base py-2 sm:py-2.5"
          >
            {canAfford ? t('game.continue.exit_button') : t('game.continue.back_home_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
