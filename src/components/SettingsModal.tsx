import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { telegram } from '../utils/telegram';
import { storage } from '../utils/storage';
import PasswordModal from './PasswordModal';
import { biometric } from '../utils/biometric';
import { useNotification } from '../hooks/useNotification';

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

type SettingsSection = 'telegram' | 'backup' | 'security' | 'ai';

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<Settings>({
    telegramBotToken: '',
    telegramChatId: '',
    notificationDays: 7,
    enableNotifications: false
  });

  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('telegram');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    // Check biometric availability
    biometric.isAvailable().then(available => {
      setBiometricAvailable(available);
      setBiometricEnabled(biometric.isEnabled());
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate if Telegram notifications are enabled
    if (formData.enableNotifications) {
      const errors: Record<string, boolean> = {};
      if (!formData.telegramBotToken?.trim()) errors.telegramBotToken = true;
      if (!formData.telegramChatId?.trim()) errors.telegramChatId = true;
      
      setValidationErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        // Focus on the first field with an error
        setTimeout(() => {
          if (errors.telegramBotToken) {
            document.getElementById('telegramBotToken')?.focus();
          } else if (errors.telegramChatId) {
            document.getElementById('telegramChatId')?.focus();
          }
        }, 50);
        return;
      }
    }
    
    // Clear validation errors if successful
    setValidationErrors({});
    onSave(formData);
  };

  const handleTestConnection = async () => {
    const errors: Record<string, boolean> = {};
    if (!formData.telegramBotToken?.trim()) errors.telegramBotToken = true;
    if (!formData.telegramChatId?.trim()) errors.telegramChatId = true;
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Focus on the first field with an error
      setTimeout(() => {
        if (errors.telegramBotToken) {
          document.getElementById('telegramBotToken')?.focus();
        } else if (errors.telegramChatId) {
          document.getElementById('telegramChatId')?.focus();
        }
      }, 50);
      return;
    }

    setTesting(true);
    const success = await telegram.testConnection(
      formData.telegramBotToken!,
      formData.telegramChatId!
    );

    setTesting(false);
    
    if (success) {
      showNotification('success', 'Test Successful!', 'Test message sent successfully! Check your Telegram.');
    } else {
      showNotification('error', 'Test Failed', 'Failed to send test message. Please check your credentials.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      
      // Check if file is encrypted
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.encrypted === true) {
          setShowImportPasswordModal(true);
        } else {
          // Regular import
          await storage.importData(file);
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showNotification('error', 'Import Failed', errorMessage);
      }
    }
    e.target.value = '';
  };

  const handlePasswordExport = (password: string) => {
    storage.exportData(password);
    setShowPasswordModal(false);
  };

  const handlePasswordImport = async (password: string) => {
    if (importFile) {
      try {
        await storage.importData(importFile, password);
        setShowImportPasswordModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showNotification('error', 'Import Failed', errorMessage);
        setShowImportPasswordModal(false);
      }
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      // Disable biometric
      biometric.disable();
      setBiometricEnabled(false);
    } else {
      // Enable biometric
      const success = await biometric.register();
      if (success) {
        setBiometricEnabled(true);
        showNotification('success', 'Biometric Enabled', 'Biometric authentication enabled successfully!');
      } else {
        showNotification('error', 'Biometric Failed', 'Failed to enable biometric authentication. Please try again.');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <button
              className={`settings-nav-item ${activeSection === 'telegram' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('telegram');
                setValidationErrors({});
              }}
              title="Telegram Notifications"
            >
              <span className="settings-nav-icon">💬</span>
              <span>Telegram</span>
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'backup' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('backup');
                setValidationErrors({});
              }}
              title="Backup & Restore"
            >
              <span className="settings-nav-icon">💾</span>
              <span>Backup</span>
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('security');
                setValidationErrors({});
              }}
              title="Security Settings"
            >
              <span className="settings-nav-icon">🔐</span>
              <span>Security</span>
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'ai' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('ai');
                setValidationErrors({});
              }}
              title="AI Settings"
            >
              <span className="settings-nav-icon">🤖</span>
              <span>AI</span>
            </button>
          </div>

          <div className="settings-panel">
            <form onSubmit={handleSubmit}>
              {activeSection === 'telegram' && (
                <>
                  <h3>Telegram Notifications</h3>
                  
                  <div className="form-group">
                    <label htmlFor="telegramBotToken">Bot Token</label>
                    <div className="input-with-button">
                      <input
                        type={showToken ? 'text' : 'password'}
                        id="telegramBotToken"
                        className={validationErrors.telegramBotToken ? 'error' : ''}
                        value={formData.telegramBotToken || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, telegramBotToken: e.target.value });
                          if (validationErrors.telegramBotToken) {
                            setValidationErrors({ ...validationErrors, telegramBotToken: false });
                          }
                        }}
                        placeholder="Your bot token from @BotFather"
                      />
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="telegramChatId">Chat ID</label>
                    <input
                      type="text"
                      id="telegramChatId"
                      className={validationErrors.telegramChatId ? 'error' : ''}
                      value={formData.telegramChatId || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, telegramChatId: e.target.value });
                        if (validationErrors.telegramChatId) {
                          setValidationErrors({ ...validationErrors, telegramChatId: false });
                        }
                      }}
                      placeholder="Your chat ID"
                    />
                  </div>

                  <div className="help-text">
                    <p>To get your Chat ID:</p>
                    <ol>
                      <li>Start a chat with your bot</li>
                      <li>Send any message to the bot</li>
                      <li>Visit: <code>https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates</code></li>
                      <li>Look for "chat":{"{}"}id": YOUR_CHAT_ID{"}"}</li>
                    </ol>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notificationDays">Notify X days before expiry</label>
                    <input
                      type="number"
                      id="notificationDays"
                      min="1"
                      max="30"
                      value={formData.notificationDays}
                      onChange={(e) => setFormData({ ...formData, notificationDays: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.enableNotifications}
                        onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
                      />
                      Enable Telegram notifications
                    </label>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleTestConnection}
                      disabled={testing}
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Settings
                    </button>
                  </div>
                </>
              )}

              {activeSection === 'backup' && (
                <>
                  <h3>Backup & Restore</h3>
                  
                  <div className="backup-section">
                    <div className="backup-card">
                      <h4>Export Data</h4>
                      <p>Download a backup of all your APIs, settings, and categories.</p>
                      <div className="export-info">
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          <strong>Your export includes:</strong>
                        </p>
                        <ul style={{ fontSize: '0.85rem', margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                          <li>All subscriptions & API keys</li>
                          <li>Custom categories</li>
                          <li>Telegram bot settings</li>
                          <li>AI provider & API key</li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => storage.exportData()}
                      >
                        📤 Export Backup
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPasswordModal(true)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        🔒 Export with Password
                      </button>
                    </div>

                    <div className="backup-card">
                      <h4>Import Data</h4>
                      <p>Restore from a previously exported backup file.</p>
                      <label className="btn btn-secondary">
                        📥 Import Backup
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </>
              )}

              {activeSection === 'security' && (
                <>
                  <h3>Security Settings</h3>
                  
                  <div className="security-section">
                    <div className="security-card">
                      <h4>Biometric Lock</h4>
                      <p>Protect SubAlert with fingerprint or face recognition on supported devices.</p>
                      
                      {biometricAvailable ? (
                        <label className="checkbox-label" style={{ marginTop: '1rem' }}>
                          <input
                            type="checkbox"
                            checked={biometricEnabled}
                            onChange={handleBiometricToggle}
                          />
                          Enable biometric authentication
                        </label>
                      ) : (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '1rem' }}>
                          Biometric authentication is not available on this device.
                        </p>
                      )}
                    </div>

                    <div className="security-info">
                      <h4>How it works</h4>
                      <ul>
                        <li>SubAlert will lock after 5 minutes of inactivity</li>
                        <li>Use your device's biometric authentication to unlock</li>
                        <li>Your biometric data never leaves your device</li>
                        <li>Works on mobile devices and supported browsers</li>
                      </ul>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </>
              )}

              {activeSection === 'ai' && (
                <>
                  <h3>AI Configuration</h3>
                  
                  <div className="ai-info">
                    <p>Configure AI to get smart subscription recommendations and cost-saving insights.</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Your API key is stored locally and never sent to our servers.
                    </p>
                  </div>
                  
                  <div className="ai-setup-button">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        onClose();
                        // Trigger AI settings from App component
                        const event = new CustomEvent('openAISettings');
                        window.dispatchEvent(event);
                      }}
                    >
                      🔧 Configure AI Provider
                    </button>
                  </div>
                  
                  <div className="ai-features">
                    <h4>What AI can do:</h4>
                    <ul>
                      <li>Analyze your subscriptions for cost savings</li>
                      <li>Identify redundant or similar services</li>
                      <li>Suggest better alternatives</li>
                      <li>Recommend bundling opportunities</li>
                      <li>Find forgotten subscriptions</li>
                    </ul>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
      
      {showPasswordModal && (
        <PasswordModal
          title="Password Protect Export"
          description="Enter a password to encrypt your backup. You'll need this password to import the file later."
          confirmButtonText="Export"
          onConfirm={handlePasswordExport}
          onCancel={() => setShowPasswordModal(false)}
          showConfirmPassword={true}
        />
      )}
      
      {showImportPasswordModal && (
        <PasswordModal
          title="Enter Password"
          description="This backup file is password protected. Enter the password to import."
          confirmButtonText="Import"
          onConfirm={handlePasswordImport}
          onCancel={() => setShowImportPasswordModal(false)}
          showConfirmPassword={false}
        />
      )}
    </div>
  );
};

export default SettingsModal;