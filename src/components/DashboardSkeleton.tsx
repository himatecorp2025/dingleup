import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard skeleton loader - shown during initial data fetch
 * Provides immediate visual feedback while wallet/profile data loads
 */
export const DashboardSkeleton = () => {
  return (
    <div 
      className="min-h-dvh min-h-svh relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #1a0033, #2d1b69, #0f0033)',
      }}
    >
      {/* Background image with opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url(/src/assets/game-background.png)`,
        }}
      />

      {/* Main content area */}
      <div className="relative z-10 flex flex-col min-h-dvh pt-4 pb-20">
        {/* Top section - Hexagon stats */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center gap-2 max-w-md mx-auto">
            {/* Left hexagon skeleton */}
            <Skeleton className="w-24 h-24 bg-white/10" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />
            
            {/* Center hexagon skeleton */}
            <Skeleton className="w-28 h-28 bg-white/10" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />
            
            {/* Right hexagon skeleton */}
            <Skeleton className="w-24 h-24 bg-white/10" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-[clamp(100px,28vw,280px)] h-[clamp(100px,28vw,280px)]">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-red-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <img 
              src="/logo.png"
              alt="DingleUP! Logo"
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Leaderboard carousel skeleton */}
        <div className="px-4 mb-6">
          <Skeleton className="h-64 w-full max-w-md mx-auto rounded-lg bg-white/10" />
        </div>

        {/* Bottom navigation skeleton */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 border-t border-white/10">
          <div className="flex justify-around items-center h-full px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-10 h-10 rounded-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
