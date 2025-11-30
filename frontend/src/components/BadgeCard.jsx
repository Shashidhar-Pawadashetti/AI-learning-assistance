import React, { memo } from 'react';

const BadgeCard = memo(({ badge }) => {
  return (
    <div className="badge-card">
      <div className="emoji">{badge.icon}</div>
      <h3>{badge.name}</h3>
      <p>{badge.description}</p>
      {badge.unlockedAt && (
        <small style={{display:'block',marginTop:'0.5rem',color:'#64748b'}}>
          Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
        </small>
      )}
    </div>
  );
});

export default BadgeCard;
