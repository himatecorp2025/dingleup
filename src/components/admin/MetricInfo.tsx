import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MetricInfoProps {
  title: string;
  description: string;
  interpretation?: string;
}

export const MetricInfo = ({ title, description, interpretation }: MetricInfoProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-2 text-white/50 hover:text-white transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 backdrop-blur-xl bg-[#1a1a3e]/95 border border-purple-500/30 text-white">
        <div className="space-y-2">
          <h4 className="font-semibold text-purple-300">{title}</h4>
          <p className="text-sm text-white/80">{description}</p>
          {interpretation && (
            <div className="pt-2 mt-2 border-t border-white/10">
              <p className="text-xs text-white/60">
                <span className="font-semibold text-purple-300">Értelmezés:</span> {interpretation}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
