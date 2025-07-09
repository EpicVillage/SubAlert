import React, { useState, useEffect } from 'react';
import { API, Category, CustomField } from '../types';

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
    website: '',
    logo: '',
    apiKey: '',
    websocketUrl: '',
    email: '',
    subscriptionType: 'free' as 'free' | 'paid',
    cost: '',
    expiryDate: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly' | 'one-time',
    autoRenews: true,
    category: 'other',
    notes: ''
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebsocket, setShowWebsocket] = useState(false);
  const [showApiKeyField, setShowApiKeyField] = useState(false);
  const [showWebsocketField, setShowWebsocketField] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [fetchingLogo, setFetchingLogo] = useState(false);

  useEffect(() => {
    if (api) {
      setFormData({
        serviceName: api.serviceName,
        serviceDescription: api.serviceDescription || '',
        website: api.website || '',
        logo: api.logo || '',
        apiKey: api.apiKey,
        websocketUrl: api.websocketUrl || '',
        email: api.email,
        subscriptionType: api.subscriptionType,
        cost: api.cost?.toString() || '',
        expiryDate: api.expiryDate || '',
        billingCycle: api.billingCycle || 'monthly',
        autoRenews: api.autoRenews !== false, // Default to true if not set
        category: api.category || 'other',
        notes: api.notes || ''
      });
      // Show fields if editing and they exist
      setShowApiKeyField(!!api.apiKey);
      setShowWebsocketField(!!api.websocketUrl);
      // Set custom fields
      setCustomFields(api.customFields || []);
    } else {
      // Reset field visibility for new entries
      setShowApiKeyField(false);
      setShowWebsocketField(false);
      setCustomFields([]);
    }
    // Clear validation errors when modal opens
    setValidationErrors({});
  }, [api]);

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '', isSensitive: false }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'name' | 'value' | 'isSensitive', val: string | boolean) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: val };
    setCustomFields(updated);
  };

  const fetchFavicon = async () => {
    if (!formData.website) return;
    
    setFetchingLogo(true);
    try {
      // Extract domain from website URL
      let domain = formData.website;
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      const url = new URL(domain);
      
      // Try multiple favicon sources
      const faviconUrls = [
        `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`,
        `${url.origin}/favicon.ico`,
        `${url.origin}/favicon.png`
      ];
      
      // Use Google's favicon service as primary option
      setFormData({ ...formData, logo: faviconUrls[0] });
    } catch (error) {
      console.error('Error fetching favicon:', error);
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: Record<string, boolean> = {};
    if (!formData.serviceName.trim()) errors.serviceName = true;
    if (showApiKeyField && !formData.apiKey.trim()) errors.apiKey = true;
    if (showWebsocketField && !formData.websocketUrl.trim()) errors.websocketUrl = true;
    if (!formData.email.trim()) errors.email = true;
    
    // Validate custom fields
    customFields.forEach((field, index) => {
      if (!field.name.trim()) errors[`customFieldName${index}`] = true;
      if (!field.value.trim()) errors[`customFieldValue${index}`] = true;
    });
    
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
        } else if (errors.websocketUrl) {
          document.getElementById('websocketUrl')?.focus();
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
      website: formData.website || undefined,
      logo: formData.logo || undefined,
      apiKey: formData.apiKey,
      websocketUrl: formData.websocketUrl || undefined,
      customFields: customFields.length > 0 ? customFields : undefined,
      email: formData.email,
      subscriptionType: formData.subscriptionType,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      expiryDate: formData.expiryDate || undefined,
      billingCycle: formData.billingCycle,
      autoRenews: formData.subscriptionType === 'paid' ? formData.autoRenews : undefined,
      category: formData.category,
      notes: formData.notes || undefined,
      createdAt: api?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(apiData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
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

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo URL</label>
            <div className="input-with-button">
              <input
                type="text"
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fetchFavicon}
                disabled={!formData.website || fetchingLogo}
                title="Fetch favicon from website"
              >
                {fetchingLogo ? '...' : '🔍 Fetch'}
              </button>
            </div>
            {formData.logo && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={formData.logo} 
                  alt="Logo preview" 
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <small style={{ color: 'var(--text-secondary)' }}>Logo preview</small>
              </div>
            )}
          </div>

          {/* Always show add buttons section when at least one button is available */}
          {(!showApiKeyField || !showWebsocketField || true) && (
            <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
              {!showApiKeyField && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApiKeyField(true)}
                  style={{ flex: 1 }}
                >
                  + Add API Key
                </button>
              )}
              {!showWebsocketField && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsocketField(true)}
                  style={{ flex: 1 }}
                >
                  + Add WebSocket
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addCustomField}
                style={{ flex: 1 }}
              >
                + Add Custom
              </button>
            </div>
          )}

          {showApiKeyField && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="apiKey">API Key</label>
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => {
                    setShowApiKeyField(false);
                    setFormData({ ...formData, apiKey: '' });
                  }}
                  title="Remove API Key"
                  style={{ marginLeft: 'auto', color: 'var(--text-danger)' }}
                >
                  ×
                </button>
              </div>
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

          {showWebsocketField && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="websocketUrl">WebSocket URL</label>
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => {
                    setShowWebsocketField(false);
                    setFormData({ ...formData, websocketUrl: '' });
                  }}
                  title="Remove WebSocket URL"
                  style={{ marginLeft: 'auto', color: 'var(--text-danger)' }}
                >
                  ×
                </button>
              </div>
              <div className="input-with-button">
                <input
                  type={showWebsocket ? 'text' : 'password'}
                  id="websocketUrl"
                  className={validationErrors.websocketUrl ? 'error' : ''}
                  value={formData.websocketUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, websocketUrl: e.target.value });
                    if (validationErrors.websocketUrl) {
                      setValidationErrors({ ...validationErrors, websocketUrl: false });
                    }
                  }}
                  placeholder="wss://example.com/socket"
                />
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => setShowWebsocket(!showWebsocket)}
                >
                  {showWebsocket ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {customFields.map((field, index) => (
            <div key={index} className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label>Custom Field {index + 1}</label>
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => removeCustomField(index)}
                  title="Remove Custom Field"
                  style={{ marginLeft: 'auto', color: 'var(--text-danger)' }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className={validationErrors[`customFieldName${index}`] ? 'error' : ''}
                  value={field.name}
                  onChange={(e) => {
                    updateCustomField(index, 'name', e.target.value);
                    if (validationErrors[`customFieldName${index}`]) {
                      setValidationErrors({ ...validationErrors, [`customFieldName${index}`]: false });
                    }
                  }}
                  placeholder="Field name"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className={validationErrors[`customFieldValue${index}`] ? 'error' : ''}
                  value={field.value}
                  onChange={(e) => {
                    updateCustomField(index, 'value', e.target.value);
                    if (validationErrors[`customFieldValue${index}`]) {
                      setValidationErrors({ ...validationErrors, [`customFieldValue${index}`]: false });
                    }
                  }}
                  placeholder="Field value"
                  style={{ flex: 2 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={field.isSensitive || false}
                  onChange={(e) => updateCustomField(index, 'isSensitive', e.target.checked)}
                  style={{ width: 'auto', marginBottom: 0 }}
                />
                <span>Sensitive field (will be masked)</span>
              </label>
            </div>
          ))}


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
                <>
                  <div className="form-group">
                    <label htmlFor="autoRenews" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="autoRenews"
                        checked={formData.autoRenews}
                        onChange={(e) => setFormData({ ...formData, autoRenews: e.target.checked })}
                        style={{ width: 'auto', marginBottom: 0 }}
                      />
                      <span>Auto-renews</span>
                    </label>
                    <small style={{ marginTop: '0.25rem', display: 'block', color: 'var(--text-secondary)' }}>
                      {formData.autoRenews 
                        ? 'Subscription will automatically renew on the billing date'
                        : 'Subscription will expire on the set date'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="expiryDate">
                      {formData.autoRenews ? 'Next Billing Date' : 'Expiry Date'}
                    </label>
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
                </>
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
              {api ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default APIModal;