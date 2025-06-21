import React, { useState, useEffect } from 'react';
import { API, Category } from '../types';

interface APIModalProps {
  api: API | null;
  categories: Category[];
  onSave: (api: API) => void;
  onClose: () => void;
}

const APIModal: React.FC<APIModalProps> = ({ api, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceDescription: '',
    apiKey: '',
    email: '',
    subscriptionType: 'free' as 'free' | 'paid',
    cost: '',
    expiryDate: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'one-time',
    category: 'other',
    notes: ''
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeyField, setShowApiKeyField] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (api) {
      setFormData({
        serviceName: api.serviceName,
        serviceDescription: api.serviceDescription || '',
        apiKey: api.apiKey,
        email: api.email,
        subscriptionType: api.subscriptionType,
        cost: api.cost?.toString() || '',
        expiryDate: api.expiryDate || '',
        billingCycle: api.billingCycle || 'monthly',
        category: api.category || 'other',
        notes: api.notes || ''
      });
      // Show API key field if editing and API key exists
      setShowApiKeyField(!!api.apiKey);
    } else {
      // Reset API key field visibility for new entries
      setShowApiKeyField(false);
    }
    // Clear validation errors when modal opens
    setValidationErrors({});
  }, [api]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: Record<string, boolean> = {};
    if (!formData.serviceName.trim()) errors.serviceName = true;
    if (showApiKeyField && !formData.apiKey.trim()) errors.apiKey = true;
    if (!formData.email.trim()) errors.email = true;
    
    // Additional validation for paid subscriptions
    if (formData.subscriptionType === 'paid') {
      if (!formData.cost.trim()) errors.cost = true;
      // Only require expiry date if billing cycle is not one-time
      if (formData.billingCycle !== 'one-time' && !formData.expiryDate) errors.expiryDate = true;
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      // Focus on the first field with an error
      setTimeout(() => {
        if (errors.serviceName) {
          document.getElementById('serviceName')?.focus();
        } else if (errors.apiKey) {
          document.getElementById('apiKey')?.focus();
        } else if (errors.email) {
          document.getElementById('email')?.focus();
        } else if (errors.cost) {
          document.getElementById('cost')?.focus();
        } else if (errors.expiryDate) {
          document.getElementById('expiryDate')?.focus();
        }
      }, 50);
      return;
    }
    
    const apiData: API = {
      id: api?.id || Date.now().toString(),
      serviceName: formData.serviceName,
      serviceDescription: formData.serviceDescription || undefined,
      apiKey: formData.apiKey,
      email: formData.email,
      subscriptionType: formData.subscriptionType,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      expiryDate: formData.expiryDate || undefined,
      billingCycle: formData.billingCycle,
      category: formData.category,
      notes: formData.notes || undefined,
      createdAt: api?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(apiData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{api ? 'Edit' : 'Add New'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="serviceName">Service Name</label>
            <input
              type="text"
              id="serviceName"
              className={validationErrors.serviceName ? 'error' : ''}
              value={formData.serviceName}
              onChange={(e) => {
                setFormData({ ...formData, serviceName: e.target.value });
                if (validationErrors.serviceName) {
                  setValidationErrors({ ...validationErrors, serviceName: false });
                }
              }}
              placeholder="e.g., OpenAI, Telegram Bot"
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceDescription">What does this service do?</label>
            <textarea
              id="serviceDescription"
              rows={2}
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              placeholder="e.g., AI language model API for text generation, chatbots, and content creation"
            />
          </div>

          {!showApiKeyField ? (
            <div className="form-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowApiKeyField(true)}
                style={{ width: '100%' }}
              >
                + Add API Key
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="apiKey">API Key</label>
              <div className="input-with-button">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  className={validationErrors.apiKey ? 'error' : ''}
                  value={formData.apiKey}
                  onChange={(e) => {
                    setFormData({ ...formData, apiKey: e.target.value });
                    if (validationErrors.apiKey) {
                      setValidationErrors({ ...validationErrors, apiKey: false });
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Associated Email</label>
            <input
              type="email"
              id="email"
              className={validationErrors.email ? 'error' : ''}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: false });
                }
              }}
              placeholder="account@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subscriptionType">Subscription Type</label>
            <select
              id="subscriptionType"
              value={formData.subscriptionType}
              onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value as 'free' | 'paid' })}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {formData.subscriptionType === 'paid' && (
            <>
              <div className="form-group">
                <label htmlFor="cost">Cost ($)</label>
                <input
                  type="number"
                  id="cost"
                  step="0.01"
                  min="0"
                  className={validationErrors.cost ? 'error' : ''}
                  value={formData.cost}
                  onChange={(e) => {
                    setFormData({ ...formData, cost: e.target.value });
                    if (validationErrors.cost) {
                      setValidationErrors({ ...validationErrors, cost: false });
                    }
                  }}
                  placeholder="9.99"
                />
              </div>

              <div className="form-group">
                <label htmlFor="billingCycle">Billing Cycle</label>
                <select
                  id="billingCycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>

              {formData.billingCycle !== 'one-time' && (
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry/Renewal Date</label>
                  <input
                    type="date"
                    id="expiryDate"
                    className={validationErrors.expiryDate ? 'error' : ''}
                    value={formData.expiryDate}
                    onChange={(e) => {
                      setFormData({ ...formData, expiryDate: e.target.value });
                      if (validationErrors.expiryDate) {
                        setValidationErrors({ ...validationErrors, expiryDate: false });
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Rate limits, important endpoints, etc."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {api ? 'Save Changes' : 'Add API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default APIModal;