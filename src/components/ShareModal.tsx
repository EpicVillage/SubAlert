import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode';
import { API } from '../types';
import { shareService, ShareOptions } from '../utils/shareService';
import './ShareModal.css';

interface ShareModalProps {
  subscription: API;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ subscription, onClose }) => {
  const [shareMethod, setShareMethod] = useState<'url' | 'qr'>('url');
  
  // Helper function to check if field has value
  const hasValue = (value: any): boolean => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };
  
  // Initialize fields based on what's available
  const [includeFields, setIncludeFields] = useState({
    serviceName: hasValue(subscription.serviceName),
    serviceDescription: hasValue(subscription.serviceDescription),
    website: hasValue(subscription.website),
    logo: hasValue(subscription.logo),
    email: false, // Default to false for sensitive data
    cost: hasValue(subscription.cost),
    billingCycle: hasValue(subscription.billingCycle),
    expiryDate: hasValue(subscription.expiryDate),
    category: hasValue(subscription.category),
    notes: false, // Default to false for potentially sensitive data
    apiKey: false, // Default to false for sensitive data
    websocketUrl: false, // Default to false for sensitive data
    customFields: false, // Default to false for potentially sensitive data
  });
  const [expirationHours, setExpirationHours] = useState(168); // 7 days default
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Generate share data whenever options change
  useEffect(() => {
    const options: ShareOptions = {
      includeFields,
      expirationHours
    };

    const { encrypted, password } = shareService.encryptData(subscription, options);
    const url = shareService.createShareURL(encrypted, password);
    setShareUrl(url);

    // Generate QR code
    if (shareMethod === 'qr') {
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (err, dataUrl) => {
        if (!err) {
          setQrDataUrl(dataUrl);
        }
      });
    }
  }, [subscription, includeFields, expirationHours, shareMethod]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = `${subscription.serviceName}-share.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const toggleField = (field: keyof typeof includeFields) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      serviceName: 'Service Name',
      serviceDescription: 'Description',
      website: 'Website',
      logo: 'Logo',
      email: 'Email',
      cost: 'Cost',
      billingCycle: 'Billing Cycle',
      expiryDate: 'Expiry Date',
      category: 'Category',
      notes: 'Notes',
      apiKey: 'API Key',
      websocketUrl: 'WebSocket URL',
      customFields: 'Custom Fields'
    };
    return labels[field] || field;
  };

  const getFieldValue = (field: keyof typeof includeFields): string => {
    const value = subscription[field];
    if (value === undefined || value === null) return 'Not set';
    
    switch (field) {
      case 'cost':
        return `$${value}`;
      case 'billingCycle':
        return value as string;
      case 'apiKey':
      case 'websocketUrl':
        return '••••••••';
      case 'customFields':
        return Array.isArray(value) ? `${value.length} fields` : 'None';
      default:
        return String(value);
    }
  };

  const hasFieldValue = (field: keyof typeof includeFields): boolean => {
    const value = subscription[field];
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Subscription</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Field Selection */}
          <div className="share-section">
            <h3>Select fields to share</h3>
            <div className="field-selection">
              {Object.entries(includeFields)
                .filter(([field]) => hasFieldValue(field as keyof typeof includeFields))
                .map(([field, included]) => (
                  <label key={field} className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleField(field as keyof typeof includeFields)}
                    />
                    <div className="field-info">
                      <span className="field-label">{getFieldLabel(field)}</span>
                      <span className={`field-value ${field === 'apiKey' || field === 'websocketUrl' ? 'sensitive' : ''}`}>
                        {getFieldValue(field as keyof typeof includeFields)}
                      </span>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="share-section">
            <h3>Expiration</h3>
            <select 
              value={expirationHours} 
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="expiration-select"
            >
              <option value={1}>1 hour</option>
              <option value={24}>1 day</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
            </select>
          </div>

          {/* Share Method Toggle */}
          <div className="share-method-toggle">
            <button 
              className={`method-btn ${shareMethod === 'url' ? 'active' : ''}`}
              onClick={() => setShareMethod('url')}
            >
              🔗 URL
            </button>
            <button 
              className={`method-btn ${shareMethod === 'qr' ? 'active' : ''}`}
              onClick={() => setShareMethod('qr')}
            >
              📱 QR Code
            </button>
          </div>

          {/* Share Display */}
          <div className="share-display">
            {shareMethod === 'url' ? (
              <div className="url-display">
                <div className="url-container">
                  <input 
                    type="text" 
                    value={shareUrl} 
                    readOnly 
                    className="share-url-input"
                  />
                  <button 
                    className="btn btn-primary copy-btn"
                    onClick={handleCopy}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="share-note">
                  This link will expire in {expirationHours < 24 ? `${expirationHours} hour${expirationHours > 1 ? 's' : ''}` : `${expirationHours / 24} day${expirationHours > 24 ? 's' : ''}`}
                </p>
              </div>
            ) : (
              <div className="qr-display">
                <img src={qrDataUrl} alt="Share QR Code" className="qr-code" />
                <button 
                  className="btn btn-secondary"
                  onClick={handleDownloadQR}
                >
                  Download QR Code
                </button>
                <p className="share-note">
                  Scan this code to import the subscription
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal;