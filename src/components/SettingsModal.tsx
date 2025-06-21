import React, { useState, useEffect } from 'react';
import { Settings, API, Category } from '../types';
import { telegram } from '../utils/telegram';
import { storage } from '../utils/storage';
import PasswordModal from './PasswordModal';
import PDFExportModal from './PDFExportModal';
import { biometric } from '../utils/biometric';
import { masterPassword, LockTimeout } from '../utils/masterPassword';
import { useNotification } from '../hooks/useNotification';
import ChangePasswordModal from './ChangePasswordModal';

interface SettingsModalProps {
  settings: Settings;
  apis?: API[];
  categories?: Category[];
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

type SettingsSection = 'telegram' | 'backup' | 'security' | 'ai';

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, apis = [], categories = [], onSave, onClose }) => {
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
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [masterPasswordEnabled, setMasterPasswordEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<LockTimeout>('5min');
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState<'setup' | 'disable' | 'change' | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    // Check biometric availability
    biometric.isAvailable().then(available => {
      setBiometricAvailable(available);
      setBiometricEnabled(biometric.isEnabled());
    });
    setMasterPasswordEnabled(masterPassword.isEnabled());
    setLockTimeout(masterPassword.getLockTimeout());
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

  const handleMasterPasswordSetup = async (password: string) => {
    const success = await masterPassword.setup(password);
    if (success) {
      setMasterPasswordEnabled(true);
      showNotification('success', 'Security', 'Master password enabled');
      
      // Prompt to enable biometric if available
      if (biometricAvailable && !biometricEnabled) {
        setTimeout(() => {
          if (window.confirm('Would you like to enable biometric authentication for easier unlocking?')) {
            handleBiometricToggle();
          }
        }, 500);
      }
    } else {
      showNotification('error', 'Security Error', 'Failed to setup master password');
    }
    setShowMasterPasswordModal(null);
  };

  const handleMasterPasswordDisable = async (password: string) => {
    const success = await masterPassword.disable(password);
    if (success) {
      setMasterPasswordEnabled(false);
      // Also disable biometric when master password is disabled
      if (biometricEnabled) {
        await biometric.disable();
        setBiometricEnabled(false);
      }
      showNotification('success', 'Security', 'Master password disabled');
    } else {
      showNotification('error', 'Security Error', 'Incorrect password');
    }
    setShowMasterPasswordModal(null);
  };

  const handleMasterPasswordChange = async (currentPassword: string, newPassword: string) => {
    const success = await masterPassword.change(currentPassword, newPassword);
    if (success) {
      showNotification('success', 'Security', 'Master password changed');
    } else {
      showNotification('error', 'Security Error', 'Incorrect current password');
    }
    setShowMasterPasswordModal(null);
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
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPDFExportModal(true)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        📄 Generate PDF Report
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
                      <h4>Master Password</h4>
                      <p>Encrypt all your data with a master password for maximum security.</p>
                      
                      <label className="checkbox-label" style={{ marginTop: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={masterPasswordEnabled}
                          onChange={() => {
                            if (masterPasswordEnabled) {
                              setShowMasterPasswordModal('disable');
                            } else {
                              setShowMasterPasswordModal('setup');
                            }
                          }}
                        />
                        Enable master password encryption
                      </label>
                      
                      {masterPasswordEnabled && (
                        <>
                          {biometricAvailable && (
                            <label className="checkbox-label" style={{ marginTop: '1rem' }}>
                              <input
                                type="checkbox"
                                checked={biometricEnabled}
                                onChange={handleBiometricToggle}
                              />
                              Enable biometric unlock
                            </label>
                          )}
                          
                          <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label htmlFor="lockTimeout">Lock timeout</label>
                            <select
                              id="lockTimeout"
                              value={lockTimeout}
                              onChange={(e) => {
                                const timeout = e.target.value as LockTimeout;
                                setLockTimeout(timeout);
                                masterPassword.setLockTimeout(timeout);
                              }}
                            >
                              <option value="immediately">Immediately</option>
                              <option value="1min">After 1 minute</option>
                              <option value="5min">After 5 minutes</option>
                              <option value="15min">After 15 minutes</option>
                              <option value="30min">After 30 minutes</option>
                              <option value="1hour">After 1 hour</option>
                              <option value="never">Never</option>
                            </select>
                          </div>
                          
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ marginTop: '1rem' }}
                            onClick={() => setShowMasterPasswordModal('change')}
                          >
                            Change Master Password
                          </button>
                        </>
                      )}
                    </div>

                    <div className="security-info">
                      <h4>How it works</h4>
                      <ul>
                        <li>SubAlert will lock after 5 minutes of inactivity</li>
                        <li>Use your device's biometric authentication to unlock</li>
                        <li>Your biometric data never leaves your device</li>
                        <li>Master password encrypts all data with AES-256-GCM</li>
                        <li>Password is never stored, only a secure hash</li>
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
      
      {showMasterPasswordModal === 'setup' && (
        <PasswordModal
          title="Setup Master Password"
          description="Create a master password to encrypt all your data"
          confirmButtonText="Setup"
          showConfirmPassword={true}
          onConfirm={handleMasterPasswordSetup}
          onCancel={() => setShowMasterPasswordModal(null)}
        />
      )}
      
      {showMasterPasswordModal === 'disable' && (
        <PasswordModal
          title="Disable Master Password"
          description="Enter your current master password to disable encryption"
          confirmButtonText="Disable"
          onConfirm={handleMasterPasswordDisable}
          onCancel={() => setShowMasterPasswordModal(null)}
        />
      )}
      
      {showMasterPasswordModal === 'change' && (
        <ChangePasswordModal
          onConfirm={handleMasterPasswordChange}
          onCancel={() => setShowMasterPasswordModal(null)}
        />
      )}
      
      {showPDFExportModal && (
        <PDFExportModal
          apis={apis}
          categories={categories}
          onClose={() => setShowPDFExportModal(false)}
        />
      )}
    </div>
  );
};

export default SettingsModal;