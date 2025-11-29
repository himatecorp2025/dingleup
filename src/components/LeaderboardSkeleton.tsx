export const LeaderboardSkeleton = () => {
  return (
    <div className="space-y-3 animate-pulse" style={{ gap: 'clamp(8px, 1.5vh, 12px)' }}>
      {[...Array(10)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center justify-between rounded-lg bg-muted/20"
          style={{ padding: 'clamp(12px, 2vh, 16px)', borderRadius: 'clamp(8px, 1.5vw, 12px)' }}
        >
          <div className="flex items-center flex-1" style={{ gap: 'clamp(8px, 1.5vw, 12px)' }}>
            <div className="rounded-full bg-muted/40" style={{ width: 'clamp(28px, 5vw, 32px)', height: 'clamp(28px, 5vw, 32px)', borderRadius: '50%' }} />
            <div className="flex-1 space-y-2">
              <div className="bg-muted/40 rounded" style={{ height: 'clamp(14px, 2vh, 16px)', width: '33%', borderRadius: 'clamp(4px, 0.8vw, 6px)' }} />
              <div className="bg-muted/30 rounded" style={{ height: 'clamp(10px, 1.5vh, 12px)', width: '25%', borderRadius: 'clamp(4px, 0.8vw, 6px)' }} />
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
            <div className="bg-muted/40 rounded" style={{ width: 'clamp(40px, 8vw, 48px)', height: 'clamp(20px, 3vh, 24px)', borderRadius: 'clamp(4px, 0.8vw, 6px)' }} />
            <div className="bg-muted/40 rounded" style={{ width: 'clamp(40px, 8vw, 48px)', height: 'clamp(20px, 3vh, 24px)', borderRadius: 'clamp(4px, 0.8vw, 6px)' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
