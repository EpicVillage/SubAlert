import React, { useState } from 'react';
import { API, Category } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { getCategoryById } from '../utils/categories';
import { getNextBillingDate, shouldShowAsRenewal } from '../utils/billing';

interface CompactAPICardProps {
  api: API;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const CompactAPICard: React.FC<CompactAPICardProps> = ({ 
  api, 
  categories, 
  onEdit, 
  onDelete, 
  isEditMode = false, 
  isSelected = false, 
  onToggleSelect 
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const getDaysLeft = () => {
    if (!api.expiryDate) return null;
    
    if (shouldShowAsRenewal(api)) {
      const nextBilling = getNextBillingDate(api.expiryDate, api.billingCycle);
      if (nextBilling) {
        return differenceInDays(nextBilling, new Date());
      }
    }
    
    return differenceInDays(parseISO(api.expiryDate), new Date());
  };

  const daysLeft = getDaysLeft();
  const isRenewal = shouldShowAsRenewal(api);
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  const isExpired = daysLeft !== null && daysLeft < 0 && !isRenewal;

  const category = getCategoryById(categories, api.category) || {
    id: 'other',
    name: 'Other',
    color: '#6b7280',
    emoji: '📦',
    isCustom: false
  };

  return (
    <div className={`api-card compact ${isEditMode ? 'edit-mode' : ''} ${isEditMode && isSelected ? 'selected' : ''} ${isExpiringSoon ? 'expiring' : ''} ${isExpired ? 'expired' : ''}`}>
      <div className="compact-content">
        <div className="compact-header">
        <div className="compact-title-row">
          {isEditMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="selection-checkbox"
            />
          )}
          {api.logo ? (
            <img 
              src={api.logo} 
              alt={`${api.serviceName} logo`}
              style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="category-emoji" style={{ fontSize: '1.25rem' }}>{category.emoji}</span>
          )}
          <h3 className="compact-service-name" title={api.serviceName}>
            {api.serviceName}
          </h3>
          {api.subscriptionType === 'free' && (
            <span className="badge-free-compact">FREE</span>
          )}
        </div>
        {api.subscriptionType === 'paid' && api.cost && (
          <div className="compact-cost">
            ${api.cost}/{api.billingCycle === 'yearly' ? 'yr' : 'mo'}
          </div>
        )}
      </div>

      <div className="compact-info">
        <div className="compact-email" title={api.email}>
          {api.email}
        </div>
        
        {api.apiKey && (
          <div className="compact-key-section">
            <span className="compact-label">Key:</span>
            <div className="compact-key-display">
              <span>{showKey ? api.apiKey.substring(0, 12) + '...' : '••••••'}</span>
              <button 
                className="compact-btn"
                onClick={() => {
                  navigator.clipboard.writeText(api.apiKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title={copied ? "Copied!" : "Copy"}
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
              <button 
                className="compact-btn"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}
        
        {api.expiryDate && (
          <div className="compact-expiry">
            <span className="compact-label">
              {isRenewal ? 'Renews:' : 'Expires:'}
            </span>
            <span className={`compact-date ${isExpiringSoon ? 'warning' : ''} ${isExpired ? 'danger' : ''}`}>
              {format(
                isRenewal && api.billingCycle
                  ? getNextBillingDate(api.expiryDate, api.billingCycle)!
                  : parseISO(api.expiryDate),
                'MMM dd'
              )}
              {daysLeft !== null && (
                <span className="compact-days">
                  {isExpired ? ` (${Math.abs(daysLeft)}d ago)` : ` (${daysLeft}d)`}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
      </div>

      {isEditMode && (
        <div className="api-card-actions-modern">
          <button className="action-btn action-edit" onClick={onEdit}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Edit</span>
          </button>
          <div className="action-divider"></div>
          <button className="action-btn action-delete" onClick={onDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CompactAPICard;