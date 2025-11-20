export const LeaderboardSkeleton = () => {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center justify-between p-4 rounded-lg bg-muted/20"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/40 rounded w-1/3" />
              <div className="h-3 bg-muted/30 rounded w-1/4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-6 bg-muted/40 rounded" />
            <div className="w-12 h-6 bg-muted/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
