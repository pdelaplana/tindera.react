// BentoTile - Dashboard action tile

import { IonIcon } from '@ionic/react';
import type React from 'react';

interface BentoTileProps {
  title: string;
  icon?: string;
  value?: string | number;
  badge?: string | number;
  size?: 'normal' | 'large';
  variant?: 'default' | 'primary';
  onClick?: () => void;
  className?: string;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  title,
  icon,
  value,
  badge,
  size = 'normal',
  variant = 'default',
  onClick,
  className = '',
}) => {
  const sizeClass = size === 'large' ? 'bento-tile--large' : '';
  const variantClass = variant === 'primary' ? 'bento-tile--primary' : '';

  return (
    <button
      type="button"
      className={`bento-tile ${sizeClass} ${variantClass} ${className}`.trim()}
      onClick={onClick}
    >
      {badge !== undefined && <span className="bento-tile__badge">{badge}</span>}

      <div>
        {icon && <IonIcon icon={icon} className="bento-tile__icon" />}
        <div className="bento-tile__title">{title}</div>
      </div>

      {value !== undefined && <div className="bento-tile__value">{value}</div>}
    </button>
  );
};

export default BentoTile;
