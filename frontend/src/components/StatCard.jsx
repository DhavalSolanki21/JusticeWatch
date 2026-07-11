import React from 'react';









const StatCard = ({ label, value, footer, footerValue, valueClass = '' }) => {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${valueClass}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {footer &&
      <div className="stat-footer">
          <span>{footer}</span>
          {footerValue && <span style={{ fontWeight: 700 }}>{footerValue}</span>}
        </div>
      }
    </div>);

};

export default StatCard;