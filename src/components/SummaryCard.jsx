import React from 'react';
import '../styles/components/Components.css';

const SummaryCard = ({ title, value, icon: Icon, colorClass }) => {
    return (
        <div className={`summary-card glass-panel ${colorClass || ''}`}>
            <div className="card-icon">
                {Icon && <Icon size={32} />}
            </div>
            <div className="card-info">
                <h3>{value}</h3>
                <p>{title}</p>
            </div>
        </div>
    );
};

export default SummaryCard;
