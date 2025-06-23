import React, { useState, useEffect } from 'react';
import { Settings, API, Category } from '../types';
import { telegram } from '../utils/telegram';
import { storage } from '../utils/storage';
import { biometric } from '../utils/biometric';
import { masterPassword, LockTimeout } from '../utils/masterPassword';
import { useNotification } from '../hooks/useNotification';
import BottomSheet from './BottomSheet';
import PasswordModal from './PasswordModal';
import PDFExportModal from './PDFExportModal';
import ChangePasswordModal from './ChangePasswordModal';
import './MobileSettingsModal.css';

interface MobileSettingsModalProps {
  settings: Settings;
  apis?: API[];
  categories?: Category[];
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

type SettingsSection = 'main' | 'telegram' | 'backup' | 'security';

const MobileSettingsModal: React.FC<MobileSettingsModalProps> = ({ settings, apis = [], categories = [], onSave, onClose }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<Settings>(settings);
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [masterPasswordEnabled, setMasterPasswordEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<LockTimeout>('5min');
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState<'setup' | 'disable' | 'change' | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);

  useEffect(() => {
    biometric.isAvailable().then(available => {
      setBiometricAvailable(available);
      setBiometricEnabled(biometric.isEnabled());
    });
    setMasterPasswordEnabled(masterPassword.isEnabled());
    setLockTimeout(masterPassword.getLockTimeout());
  }, []);

  const handleTestConnection = async () => {
    if (!formData.telegramBotToken?.trim() || !formData.telegramChatId?.trim()) {
      showNotification('error', 'Missing Credentials', 'Please fill in both Bot Token and Chat ID');
      return;
    }

    setTesting(true);
    const success = await telegram.testConnection(
      formData.telegramBotToken!,
      formData.telegramChatId!
    );
    setTesting(false);

    if (success) {
      showNotification('success', 'Success!', 'Connection successful! Test message sent.');
    } else {
      showNotification('error', 'Connection Failed', 'Please check your credentials.');
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      await biometric.disable();
      setBiometricEnabled(false);
      showNotification('success', 'Security', 'Biometric lock disabled');
    } else {
      const success = await biometric.register();
      if (success) {
        setBiometricEnabled(true);
        showNotification('success', 'Security', 'Biometric lock enabled');
      } else {
        showNotification('error', 'Security Error', 'Failed to enable biometric lock');
      }
    }
  };

  const handleExport = (encrypted: boolean) => {
    if (encrypted) {
      setShowPasswordModal(true);
    } else {
      storage.exportData();
      showNotification('success', 'Backup Complete', 'Backup downloaded');
    }
  };

  const handlePasswordExport = (password: string) => {
    storage.exportData(password);
    showNotification('success', 'Backup Complete', 'Encrypted backup downloaded');
    setShowPasswordModal(false);
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

  const handleImport = async (file: File, password?: string) => {
    try {
      await storage.importData(file, password);
      showNotification('success', 'Import Complete', 'Data imported successfully!');
      setImportFile(null);
      setShowImportPasswordModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check the file and password.';
      if (errorMessage.includes('password protected')) {
        // File is encrypted, show password modal
        setImportFile(file);
        setShowImportPasswordModal(true);
      } else {
        showNotification('error', 'Import Failed', errorMessage);
      }
    }
  };

  const renderMainMenu = () => (
    <div className="mobile-settings-menu">
      <button
        className="mobile-settings-item"
        onClick={() => setActiveSection('telegram')}
      >
        <span className="mobile-settings-icon">💬</span>
        <div className="mobile-settings-info">
          <h4>Telegram Notifications</h4>
          <p>{formData.enableNotifications ? 'Enabled' : 'Disabled'}</p>
        </div>
        <span className="mobile-settings-arrow">›</span>
      </button>

      <button
        className="mobile-settings-item"
        onClick={() => setActiveSection('backup')}
      >
        <span className="mobile-settings-icon">💾</span>
        <div className="mobile-settings-info">
          <h4>Backup & Restore</h4>
          <p>Export or import your data</p>
        </div>
        <span className="mobile-settings-arrow">›</span>
      </button>

      <button
        className="mobile-settings-item"
        onClick={() => setActiveSection('security')}
      >
        <span className="mobile-settings-icon">🔐</span>
        <div className="mobile-settings-info">
          <h4>Security</h4>
          <p>{biometricEnabled ? 'Biometric lock enabled' : 'Set up security'}</p>
        </div>
        <span className="mobile-settings-arrow">›</span>
      </button>

      <div className="mobile-settings-actions">
        <button className="btn btn-primary" onClick={() => onSave(formData)}>
          Save Settings
        </button>
      </div>
    </div>
  );

  const renderTelegramSection = () => (
    <div className="mobile-settings-section">
      <button className="mobile-settings-back" onClick={() => setActiveSection('main')}>
        <span>‹</span> Back
      </button>
      
      <h3>Telegram Notifications</h3>
      
      <div className="form-group">
        <div className="toggle-container">
          <div className="toggle-content">
            <h4>Enable Notifications</h4>
            <p className="toggle-description">
              Get alerts before subscriptions expire
            </p>
          </div>
          <label htmlFor="enableNotifications" className="toggle-switch">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={formData.enableNotifications}
              onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {formData.enableNotifications && (
        <>
          <div className="form-group">
            <label>Bot Token</label>
            <div className="input-with-button">
              <input
                type={showToken ? 'text' : 'password'}
                value={formData.telegramBotToken || ''}
                onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
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
            <label>Chat ID</label>
            <input
              type="text"
              value={formData.telegramChatId || ''}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              placeholder="Your chat ID"
            />
          </div>

          <div className="form-group">
            <label>Notify days before expiry</label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.notificationDays}
              onChange={(e) => setFormData({ ...formData, notificationDays: parseInt(e.target.value) })}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </>
      )}
    </div>
  );

  const renderBackupSection = () => (
    <div className="mobile-settings-section">
      <button className="mobile-settings-back" onClick={() => setActiveSection('main')}>
        <span>‹</span> Back
      </button>
      
      <h3>Backup & Restore</h3>
      
      <div className="backup-options">
        <h4>Export Data</h4>
        <button className="btn btn-secondary" onClick={() => handleExport(false)}>
          Download Backup
        </button>
        <button className="btn btn-primary" onClick={() => handleExport(true)}>
          Download Encrypted Backup
        </button>
        <button className="btn btn-secondary" onClick={() => setShowPDFExportModal(true)}>
          Generate PDF Report
        </button>
      </div>

      <div className="backup-options">
        <h4>Import Data</h4>
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".json"
            id="import-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImport(file);
              }
              e.target.value = ''; // Reset input
            }}
            className="file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="import-file" className="btn btn-secondary">
            Choose File
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="mobile-settings-section">
      <button className="mobile-settings-back" onClick={() => setActiveSection('main')}>
        <span>‹</span> Back
      </button>
      
      <h3>Security</h3>
      
      <div className="form-group">
        <div className="toggle-container">
          <div className="toggle-content">
            <h4>Master Password</h4>
            <p className="toggle-description">
              Encrypt all data with a master password
            </p>
          </div>
          <label htmlFor="masterPassword" className="toggle-switch">
            <input
              type="checkbox"
              id="masterPassword"
              checked={masterPasswordEnabled}
              onChange={() => {
                if (masterPasswordEnabled) {
                  setShowMasterPasswordModal('disable');
                } else {
                  setShowMasterPasswordModal('setup');
                }
              }}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      {masterPasswordEnabled && biometricAvailable && (
        <div className="form-group">
          <div className="toggle-container">
            <div className="toggle-content">
              <h4>Biometric Unlock</h4>
              <p className="toggle-description">
                Use fingerprint or Face ID to unlock
              </p>
            </div>
            <label htmlFor="biometricLock" className="toggle-switch">
              <input
                type="checkbox"
                id="biometricLock"
                checked={biometricEnabled}
                onChange={handleBiometricToggle}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      )}
      
      {masterPasswordEnabled && (
        <div className="form-group">
          <label>Lock Timeout</label>
          <select
            value={lockTimeout}
            onChange={(e) => {
              const timeout = e.target.value as LockTimeout;
              setLockTimeout(timeout);
              masterPassword.setLockTimeout(timeout);
            }}
            className="form-select"
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
      )}
      
      {masterPasswordEnabled && (
        <div className="form-group">
          <button
            className="btn btn-secondary"
            onClick={() => setShowMasterPasswordModal('change')}
          >
            Change Master Password
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <BottomSheet
        isOpen={true}
        onClose={onClose}
        title="Settings"
      >
        {activeSection === 'main' && renderMainMenu()}
        {activeSection === 'telegram' && renderTelegramSection()}
        {activeSection === 'backup' && renderBackupSection()}
        {activeSection === 'security' && renderSecuritySection()}
      </BottomSheet>
      
      {showPasswordModal && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <PasswordModal
            title="Encrypt Backup"
            description="Enter a password to encrypt your backup file"
            onConfirm={handlePasswordExport}
            onCancel={() => setShowPasswordModal(false)}
          />
        </div>
      )}
      
      {showMasterPasswordModal === 'setup' && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <PasswordModal
            title="Setup Master Password"
            description="Create a master password to encrypt all your data"
            confirmButtonText="Setup"
            showConfirmPassword={true}
            onConfirm={handleMasterPasswordSetup}
            onCancel={() => setShowMasterPasswordModal(null)}
          />
        </div>
      )}
      
      {showMasterPasswordModal === 'disable' && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <PasswordModal
            title="Disable Master Password"
            description="Enter your current master password to disable encryption"
            confirmButtonText="Disable"
            onConfirm={handleMasterPasswordDisable}
            onCancel={() => setShowMasterPasswordModal(null)}
          />
        </div>
      )}
      
      {showMasterPasswordModal === 'change' && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <ChangePasswordModal
            onConfirm={handleMasterPasswordChange}
            onCancel={() => setShowMasterPasswordModal(null)}
          />
        </div>
      )}
      
      {showPDFExportModal && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <PDFExportModal
            apis={apis}
            categories={categories}
            onClose={() => setShowPDFExportModal(false)}
          />
        </div>
      )}
      
      {showImportPasswordModal && importFile && (
        <div style={{ position: 'fixed', zIndex: 10000 }}>
          <PasswordModal
            title="Password Required"
            description="This backup file is encrypted. Enter the password to import."
            confirmButtonText="Import"
            onConfirm={(password) => handleImport(importFile, password)}
            onCancel={() => {
              setShowImportPasswordModal(false);
              setImportFile(null);
            }}
          />
        </div>
      )}
    </>
  );
};

export default MobileSettingsModal;