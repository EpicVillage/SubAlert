import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { telegram } from '../utils/telegram';
import { storage } from '../utils/storage';
import { biometric } from '../utils/biometric';
import { useNotification } from '../hooks/useNotification';
import BottomSheet from './BottomSheet';
import './MobileSettingsModal.css';

interface MobileSettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

type SettingsSection = 'main' | 'telegram' | 'backup' | 'security';

const MobileSettingsModal: React.FC<MobileSettingsModalProps> = ({ settings, onSave, onClose }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<Settings>(settings);
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    biometric.isAvailable().then(available => {
      setBiometricAvailable(available);
      setBiometricEnabled(biometric.isEnabled());
    });
  }, []);

  const handleTestConnection = async () => {
    if (!formData.telegramBotToken?.trim() || !formData.telegramChatId?.trim()) {
      showNotification('error', 'Please fill in both Bot Token and Chat ID');
      return;
    }

    setTesting(true);
    const success = await telegram.testConnection(
      formData.telegramBotToken!,
      formData.telegramChatId!
    );
    setTesting(false);

    if (success) {
      showNotification('success', 'Connection successful! Test message sent.');
    } else {
      showNotification('error', 'Connection failed. Please check your credentials.');
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      await biometric.disable();
      setBiometricEnabled(false);
      showNotification('success', 'Biometric lock disabled');
    } else {
      const success = await biometric.enable();
      if (success) {
        setBiometricEnabled(true);
        showNotification('success', 'Biometric lock enabled');
      } else {
        showNotification('error', 'Failed to enable biometric lock');
      }
    }
  };

  const handleExport = (encrypted: boolean) => {
    storage.exportData(encrypted).then(() => {
      showNotification('success', encrypted ? 'Encrypted backup downloaded' : 'Backup downloaded');
    });
  };

  const handleImport = async (file: File, password?: string) => {
    try {
      await storage.importData(file, password);
      showNotification('success', 'Data imported successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showNotification('error', 'Failed to import data. Check the file and password.');
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
        <label htmlFor="enableNotifications" className="toggle-label">
          <span>Enable Notifications</span>
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
      </div>

      <div className="backup-options">
        <h4>Import Data</h4>
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImport(file);
            }
          }}
          className="file-input"
        />
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="mobile-settings-section">
      <button className="mobile-settings-back" onClick={() => setActiveSection('main')}>
        <span>‹</span> Back
      </button>
      
      <h3>Security</h3>
      
      {biometricAvailable ? (
        <div className="form-group">
          <label htmlFor="biometricLock" className="toggle-label">
            <div>
              <span>Biometric Lock</span>
              <p className="toggle-description">
                Use fingerprint or Face ID to unlock the app
              </p>
            </div>
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
      ) : (
        <div className="info-message">
          <p>Biometric authentication is not available on this device.</p>
        </div>
      )}
    </div>
  );

  return (
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
  );
};

export default MobileSettingsModal;