import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiamondHexagon } from './DiamondHexagon';

interface UsersHexagonBarProps {
  username: string;
  rank: number | null;
  coins: number;
  lives: number;
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
  avatarUrl,
  className = ''
}) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} style={{ minWidth: '200px', minHeight: '100px' }}>
      {/* Rank Hexagon - Blue */}
      <div className="absolute z-10" style={{ left: '22%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="rank" value={rank !== null ? rank : '...'} />
      </div>

      {/* Coins Hexagon - Gold */}
      <div className="absolute z-10" style={{ left: '44%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="coins" value={coins} />
      </div>

      {/* Lives Hexagon - Red */}
      <div className="absolute z-10" style={{ left: '66%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="lives" value={lives} />
      </div>

      {/* Avatar Hexagon - Purple */}
      <div className="absolute z-10" style={{ left: '88%', top: '36%', transform: 'translate(-50%, -50%)' }}>
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