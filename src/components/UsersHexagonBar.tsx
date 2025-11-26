import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiamondHexagon } from './DiamondHexagon';
import { RankHexagon } from './RankHexagon';
import { NextLifeTimer } from './NextLifeTimer';

interface UsersHexagonBarProps {
  username: string;
  rank: number | null;
  coins: number;
  lives: number;
  livesMax: number;
  nextLifeAt: string | null;
  serverDriftMs?: number;
  onLifeExpired?: () => void;
  activeSpeedToken?: {
    expiresAt: string;
    durationMinutes: number;
  } | null;
  avatarUrl?: string | null;
  className?: string;
}

/**
 * Users hexagon bar component
 * Purple SVG background container with 4 hexagons positioned inside:
 * - Blue hexagon (rank)
 * - Gold hexagon (coins)
 * - Red hexagon (lives)
 * - Purple hexagon (avatar)
 */
export const UsersHexagonBar: React.FC<UsersHexagonBarProps> = ({
  username,
  rank,
  coins,
  lives,
  livesMax,
  nextLifeAt,
  serverDriftMs = 0,
  onLifeExpired,
  activeSpeedToken,
  avatarUrl,
  className = ''
}) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} style={{ minWidth: '260px', minHeight: '100px' }}>
      {/* Rank Hexagon - Piros, külön komponenssel */}
      <div className="absolute z-10" style={{ left: '15%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <RankHexagon
          value={rank !== null ? rank : '...'}
          onClick={() => navigate('/leaderboard')}
        />
      </div>

      {/* Coins Hexagon - Gold */}
      <div className="absolute z-10" style={{ left: '40%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="coins" value={coins} />
      </div>

      {/* Lives Hexagon - Red with Timer */}
      <div className="absolute z-10" style={{ left: '65%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <div className="relative">
          <DiamondHexagon type="lives" value={`${lives}/${livesMax}`} />
          {activeSpeedToken ? (
            <NextLifeTimer
              nextLifeAt={activeSpeedToken.expiresAt}
              livesCurrent={lives}
              livesMax={livesMax}
              serverDriftMs={serverDriftMs}
              onExpired={onLifeExpired}
              isSpeedBoost={true}
            />
          ) : (
            <NextLifeTimer
              nextLifeAt={nextLifeAt}
              livesCurrent={lives}
              livesMax={livesMax}
              serverDriftMs={serverDriftMs}
              onExpired={onLifeExpired}
            />
          )}
        </div>
      </div>

      {/* Avatar Hexagon - Purple */}
      <div className="absolute z-10" style={{ left: '90%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon 
          type="avatar" 
          value={username} 
          avatarUrl={avatarUrl}
          onClick={() => navigate('/profile')}
        />
      </div>
    </div>
  );
};
