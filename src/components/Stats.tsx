import React from 'react';

interface StatsProps {
  totalApis: number;
  expiringSoon: number;
  monthlyCost: number;
}

const Stats: React.FC<StatsProps> = ({ totalApis, expiringSoon, monthlyCost }) => {
  return (
    <div className="stats">
      <div className="stat-card">
        <h3>Total Subscriptions</h3>
        <p className="stat-value">{totalApis}</p>
      </div>
      <div className="stat-card">
        <h3>Expiring Soon</h3>
        <p className="stat-value" style={{ color: expiringSoon > 0 ? '#f59e0b' : 'inherit' }}>
          {expiringSoon}
        </p>
      </div>
      <div className="stat-card">
        <h3>Monthly Cost</h3>
        <p className="stat-value">${monthlyCost.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Stats;