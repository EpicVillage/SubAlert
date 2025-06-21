import React, { useState } from 'react';
import { API, Category } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { getCategoryById } from '../utils/categories';
import { getNextBillingDate, shouldShowAsRenewal } from '../utils/billing';
import FeatureComparison from './FeatureComparison';

interface APICardProps {
  api: API;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  isEditMode?: boolean;
}

const APICard: React.FC<APICardProps> = ({ api, categories, onEdit, onDelete, isEditMode = false }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getDaysLeft = () => {
    if (!api.expiryDate) return null;
    
    // For auto-renewing subscriptions, calculate from next billing date
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
    <div className={`api-card ${isExpiringSoon ? 'expiring' : ''} ${isExpired ? 'expired' : ''}`}>
      <div className="api-card-header">
        <h3>{api.serviceName}</h3>
        <span 
          className="category-badge" 
          style={{ backgroundColor: category.color }}
          title={category.name}
        >
          {category.emoji} {category.name}
        </span>
      </div>

      <div className="api-card-content">
        <div className="api-field">
          <label>Email:</label>
          <span>{api.email}</span>
        </div>

        {api.apiKey && (
          <div className="api-field">
            <label>API Key:</label>
            <div className="api-key-display">
              <span>{showKey ? api.apiKey : '••••••••'}</span>
              <div className="api-key-actions">
                <button 
                  className={`btn-icon-small ${copied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(api.apiKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                >
                  {copied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
                <button 
                  className="btn-icon-small"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {api.subscriptionType === 'paid' && (
          <>
            {api.cost && (
              <div className="api-field">
                <label>Cost:</label>
                <span>${api.cost}/{api.billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
            )}
            {api.expiryDate && (
              <div className="api-field">
                <label>{isRenewal ? 'Next Billing:' : 'Expires:'}</label>
                <span className={isExpiringSoon ? 'text-warning' : isExpired ? 'text-danger' : ''}>
                  {(() => {
                    const displayDate = isRenewal 
                      ? getNextBillingDate(api.expiryDate, api.billingCycle)
                      : parseISO(api.expiryDate);
                    return displayDate ? format(displayDate, 'dd/MM/yyyy') : 'N/A';
                  })()}
                  {daysLeft !== null && (
                    <small> 
                      {isRenewal 
                        ? `(renews in ${daysLeft} days)`
                        : isExpired 
                          ? `(${Math.abs(daysLeft)} days ago)` 
                          : `(${daysLeft} days)`
                      }
                    </small>
                  )}
                </span>
                {isRenewal && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <small className="text-secondary">🔄 Auto-renews {api.billingCycle}</small>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {api.notes && (
          <div className="api-field">
            <label>Notes:</label>
            <p className="api-notes">{api.notes}</p>
          </div>
        )}

        {api.subscriptionType === 'paid' && (
          <div className="api-field">
            <button 
              className="btn btn-secondary compare-btn"
              onClick={() => setShowComparison(true)}
              style={{ marginTop: '0.5rem' }}
            >
              Compare Alternatives
            </button>
          </div>
        )}
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

      {showComparison && (
        <FeatureComparison 
          api={api} 
          onClose={() => setShowComparison(false)} 
        />
      )}
    </div>
  );
};

export default APICard;