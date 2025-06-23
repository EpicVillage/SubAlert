import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../types';
import { shareService } from '../utils/shareService';
import { storage } from '../utils/storage';
import { useNotification } from '../hooks/useNotification';
import './ShareImport.css';

const ShareImport: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<Partial<API> | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const handleImport = async () => {
      try {
        // For HashRouter, we need to construct the URL properly
        const currentHash = window.location.hash;
        const fullUrl = window.location.origin + '/' + currentHash;
        
        const parsed = shareService.parseShareURL(fullUrl);
        
        if (!parsed) {
          throw new Error('Invalid share link format');
        }

        const { encrypted, password } = parsed;
        const decryptedData = shareService.decryptData(encrypted, password);
        
        setSharedData(decryptedData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import data');
        setLoading(false);
      }
    };

    handleImport();
  }, []);

  const handleConfirmImport = async () => {
    if (!sharedData || !sharedData.serviceName) return;

    setImporting(true);
    
    try {
      // Get existing APIs
      const apis = storage.getAPIs();
      
      // Check for duplicates
      const duplicate = apis.find(api => 
        api.serviceName === sharedData.serviceName && 
        api.email === sharedData.email
      );

      if (duplicate) {
        const confirmReplace = window.confirm(
          `You already have a subscription for ${sharedData.serviceName} with email ${sharedData.email}. Do you want to replace it?`
        );
        
        if (!confirmReplace) {
          setImporting(false);
          return;
        }
        
        // Remove the duplicate
        const filtered = apis.filter(api => api.id !== duplicate.id);
        apis.length = 0;
        apis.push(...filtered);
      }

      // Create new API entry
      const newApi: API = {
        id: Date.now().toString(),
        serviceName: sharedData.serviceName,
        serviceDescription: sharedData.serviceDescription,
        website: sharedData.website,
        logo: sharedData.logo,
        apiKey: sharedData.apiKey || '',
        websocketUrl: sharedData.websocketUrl,
        customFields: sharedData.customFields,
        email: sharedData.email || '',
        subscriptionType: sharedData.cost ? 'paid' : 'free',
        cost: sharedData.cost,
        expiryDate: sharedData.expiryDate,
        billingCycle: sharedData.billingCycle,
        category: sharedData.category || 'other',
        notes: sharedData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to storage
      apis.push(newApi);
      storage.saveAPIs(apis);

      showNotification('success', 'Import Successful', `${sharedData.serviceName} has been added to your subscriptions`);
      navigate('/');
    } catch (err) {
      showNotification('error', 'Import Failed', 'Failed to save the subscription');
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="share-import-container">
        <div className="loading-spinner"></div>
        <p>Decrypting shared data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="share-import-container">
        <div className="error-container">
          <h2>❌ Import Failed</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="share-import-container">
      <div className="import-card">
        <h2>Import Subscription</h2>
        
        {sharedData && (
          <div className="shared-data-preview">
            <h3>{sharedData.serviceName}</h3>
            
            <div className="data-fields">
              {sharedData.serviceDescription && (
                <div className="data-field">
                  <label>Description:</label>
                  <span>{sharedData.serviceDescription}</span>
                </div>
              )}
              
              {sharedData.website && (
                <div className="data-field">
                  <label>Website:</label>
                  <span>{sharedData.website}</span>
                </div>
              )}
              
              {sharedData.email && (
                <div className="data-field">
                  <label>Email:</label>
                  <span>{sharedData.email}</span>
                </div>
              )}
              
              {sharedData.cost && (
                <div className="data-field">
                  <label>Cost:</label>
                  <span>${sharedData.cost} / {sharedData.billingCycle || 'month'}</span>
                </div>
              )}
              
              {sharedData.expiryDate && (
                <div className="data-field">
                  <label>Expiry Date:</label>
                  <span>{new Date(sharedData.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {sharedData.apiKey && (
                <div className="data-field">
                  <label>API Key:</label>
                  <span className="sensitive">••••••••</span>
                </div>
              )}
              
              {sharedData.websocketUrl && (
                <div className="data-field">
                  <label>WebSocket URL:</label>
                  <span className="sensitive">••••••••</span>
                </div>
              )}
              
              {sharedData.customFields && sharedData.customFields.length > 0 && (
                <div className="data-field">
                  <label>Custom Fields:</label>
                  <span>{sharedData.customFields.length} fields</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="import-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleConfirmImport}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import Subscription'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
            disabled={importing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareImport;