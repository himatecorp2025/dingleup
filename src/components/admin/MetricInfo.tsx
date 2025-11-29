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
        <button className="ml-[clamp(0.25rem,1vw,0.5rem)] text-white/50 hover:text-white transition-colors">
          <Info className="w-[clamp(0.875rem,2vw,1rem)] h-[clamp(0.875rem,2vw,1rem)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[clamp(16rem,40vw,20rem)] backdrop-blur-xl bg-[#1a1a3e]/95 border border-purple-500/30 text-white">
        <div className="space-y-[clamp(0.375rem,1vw,0.5rem)]">
          <h4 className="font-semibold text-purple-300 text-[clamp(0.875rem,2vw,1rem)]">{title}</h4>
          <p className="text-[clamp(0.75rem,1.75vw,0.875rem)] text-white/80">{description}</p>
          {interpretation && (
            <div className="pt-[clamp(0.375rem,1vw,0.5rem)] mt-[clamp(0.375rem,1vw,0.5rem)] border-t border-white/10">
              <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-white/60">
                <span className="font-semibold text-purple-300">Értelmezés:</span> {interpretation}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
