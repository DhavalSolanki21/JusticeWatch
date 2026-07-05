import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
};

export default StatCard;
