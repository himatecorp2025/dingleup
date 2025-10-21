import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ExitGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
}

export const ExitGameDialog = ({
  open,
  onOpenChange,
  onConfirmExit
}: ExitGameDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] border-2 border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="w-7 h-7 text-yellow-500" />
            Biztosan kilépsz?
          </DialogTitle>
          <DialogDescription className="text-base text-white/80 pt-2">
            Ha visszalépsz, minden eddig összegyűjtött eredmény törlődik és nem kapsz aranyérmet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:gap-2 mt-4">
          <Button 
            onClick={onConfirmExit} 
            className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
          >
            Kilépés
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 bg-green-500/5"
          >
            Maradok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
