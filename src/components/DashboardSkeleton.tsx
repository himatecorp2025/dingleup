/**
 * Dashboard skeleton loader - shown during initial data fetch
 * Displays only background and logo while data loads
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

      {/* Main content area - csak logo, minden más elrejtve */}
      <div className="relative z-10 flex flex-col min-h-dvh items-center justify-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-[clamp(120px,35vw,320px)] h-[clamp(120px,35vw,320px)]">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-red-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <img 
              src="/logo.png"
              alt="DingleUP! Logo"
              className="relative w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
