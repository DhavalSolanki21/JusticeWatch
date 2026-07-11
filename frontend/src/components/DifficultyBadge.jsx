import React from 'react';








const DifficultyBadge = ({ tier, score, showScore = false }) => {
  if (!tier) return <span className="badge" style={{ color: 'var(--text-faint)' }}>—</span>;

  const badgeClass = `badge badge-${tier}`;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span className={badgeClass}>{tier}</span>
      {showScore && score != null &&
      <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
          {(score * 100).toFixed(0)}%
        </span>
      }
    </span>);

};

export default DifficultyBadge;