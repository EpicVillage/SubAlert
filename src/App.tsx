import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Header from './components/Header';
import APIModal from './components/APIModal';
import SettingsModal from './components/SettingsModal';
import MobileSettingsModal from './components/MobileSettingsModal';
import CategoryManager from './components/CategoryManager';
import ConfirmModal from './components/ConfirmModal';
import MasterPasswordLock from './components/MasterPasswordLock';
import PasswordModal from './components/PasswordModal';
import ExportOptionsModal from './components/ExportOptionsModal';
import ShareImport from './components/ShareImport';
import { AISettings } from './components/AISettings';
import { AIRecommendations } from './components/AIRecommendations';
import { AIMenu } from './components/AIMenu';
import PullToRefresh from './components/PullToRefresh';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import InstallPrompt from './components/InstallPrompt';
import { API, Settings, Category } from './types';
import { storage } from './utils/storage';
import { setupNotificationScheduler } from './utils/notificationScheduler';
import { useNotification } from './hooks/useNotification';
import { useTheme } from './hooks/useTheme';
import { useIsTouchDevice } from './hooks/useTouch';
import { masterPassword } from './utils/masterPassword';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  const { showNotification } = useNotification();
  const [apis, setApis] = useState<API[]>(() => {
    // Initialize state directly from storage
    return storage.getAPIs();
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    // Initialize categories directly from storage
    return storage.getCategories();
  });
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingAPI, setEditingAPI] = useState<API | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showBulkExportOptions, setShowBulkExportOptions] = useState(false);
  const [showBulkExportPasswordModal, setShowBulkExportPasswordModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isMasterPasswordLocked, setIsMasterPasswordLocked] = useState(false);
  const [showAIModal, setShowAIModal] = useState<'menu' | 'settings' | 'recommendations' | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Setup notification scheduler
    setupNotificationScheduler();
    
    // Check if master password lock is needed only on initial mount
    if (masterPassword.needsUnlock()) {
      setIsMasterPasswordLocked(true);
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Set up activity tracking
    const updateActivity = () => {
      if (masterPassword.isEnabled() && !isMasterPasswordLocked) {
        masterPassword.updateLastActivity();
      }
    };
    
    // Listen for AI settings event from Settings modal
    const handleOpenAISettings = () => {
      setShowAIModal('settings');
    };
    window.addEventListener('openAISettings', handleOpenAISettings);
    
    // Track user activity
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });
    
    // Check for inactivity every minute
    const inactivityCheck = setInterval(() => {
      if (masterPassword.needsUnlock() && !isMasterPasswordLocked) {
        setIsMasterPasswordLocked(true);
      }
    }, 60000);
    
    return () => {
      window.removeEventListener('openAISettings', handleOpenAISettings);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [isMasterPasswordLocked]);

  useEffect(() => {
    storage.saveAPIs(apis);
  }, [apis]);

  useEffect(() => {
    storage.saveCategories(categories);
  }, [categories]);

  const handleAddAPI = () => {
    setEditingAPI(null);
    setShowAPIModal(true);
  };

  const handleEditAPI = (api: API) => {
    setEditingAPI(api);
    setShowAPIModal(true);
  };

  const handleSaveAPI = (api: API) => {
    if (editingAPI) {
      setApis(apis.map(a => a.id === api.id ? api : a));
    } else {
      setApis([...apis, api]);
    }
    setShowAPIModal(false);
  };

  const handleDeleteAPI = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      setApis(apis.filter(a => a.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    setShowSettingsModal(false);
  };

  const handleUpdateAPI = (api: API) => {
    setApis(apis.map(a => a.id === api.id ? api : a));
  };

  const handleSaveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    setShowCategoryManager(false);
  };

  const handleRefresh = useCallback(async () => {
    // Simulate refresh - in a real app, this might fetch from a server
    const refreshedApis = storage.getAPIs();
    const refreshedCategories = storage.getCategories();
    const refreshedSettings = storage.getSettings();
    
    setApis(refreshedApis);
    setCategories(refreshedCategories);
    setSettings(refreshedSettings);
    
    // Small delay to show refresh animation
    await new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  // Listen for storage changes (from imports or other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const refreshedApis = storage.getAPIs();
      setApis(refreshedApis);
    };

    // Custom event for when APIs are updated
    window.addEventListener('apis-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('apis-updated', handleStorageChange);
    };
  }, []);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === apis.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(apis.map(api => api.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Clear selection when exiting edit mode
      setSelectedIds(new Set());
    }
  };

  // Bulk operation handlers
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    setApis(apis.filter(api => !selectedIds.has(api.id)));
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleBulkCategoryChange = (categoryId: string) => {
    if (selectedIds.size === 0) return;
    
    setApis(apis.map(api => 
      selectedIds.has(api.id) ? { ...api, category: categoryId } : api
    ));
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    setShowBulkExportOptions(true);
  };

  const handleBulkExportWithoutPassword = () => {
    const selectedApis = apis.filter(api => selectedIds.has(api.id));
    const dataStr = JSON.stringify(selectedApis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `subalert-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setSelectedIds(new Set());
    setShowBulkExportOptions(false);
    showNotification('success', 'Export Successful', `Exported ${selectedApis.length} subscription${selectedApis.length > 1 ? 's' : ''}`);
  };

  const handleBulkExportWithPassword = (password: string) => {
    const selectedApis = apis.filter(api => selectedIds.has(api.id));
    
    // Import crypto for encryption
    import('./utils/crypto').then(async ({ crypto }) => {
      const dataStr = JSON.stringify(selectedApis);
      const encrypted = await crypto.encrypt(dataStr, password);
      const exportData = {
        encrypted: true,
        data: encrypted
      };
      
      const exportStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(exportStr);
      
      const exportFileDefaultName = `subalert-export-encrypted-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSelectedIds(new Set());
      setShowBulkExportPasswordModal(false);
      setShowBulkExportOptions(false);
      showNotification('success', 'Export Successful', `Exported ${selectedApis.length} encrypted subscription${selectedApis.length > 1 ? 's' : ''}`);
    });
  };

  return (
    <Router>
      <div className="App">
        {isMasterPasswordLocked ? (
          <MasterPasswordLock onUnlocked={() => {
            setIsMasterPasswordLocked(false);
            // Reload data after unlock
            setApis(storage.getAPIs());
            setCategories(storage.getCategories());
            setSettings(storage.getSettings());
          }} />
        ) : (
        <>
        <InstallPrompt />
        <Header 
          onAddAPI={handleAddAPI}
          onOpenSettings={() => setShowSettingsModal(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onOpenCategories={() => setShowCategoryManager(true)}
          onOpenAI={() => setShowAIModal('menu')}
          selectedCount={selectedIds.size}
          onSelectAll={handleSelectAll}
        />
        <Routes>
          <Route path="/" element={
            isTouchDevice ? (
              isAndroid ? (
                <Dashboard 
                  apis={apis}
                  categories={categories}
                  onEditAPI={handleEditAPI}
                  onDeleteAPI={handleDeleteAPI}
                  onUpdateAPI={handleUpdateAPI}
                  isEditMode={isEditMode}
                  isMobile={true}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                />
              ) : (
                <PullToRefresh onRefresh={handleRefresh}>
                  <Dashboard 
                    apis={apis}
                    categories={categories}
                    onEditAPI={handleEditAPI}
                    onDeleteAPI={handleDeleteAPI}
                    onUpdateAPI={handleUpdateAPI}
                    isEditMode={isEditMode}
                    isMobile={true}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                  />
                </PullToRefresh>
              )
            ) : (
              <Dashboard 
                apis={apis}
                categories={categories}
                onEditAPI={handleEditAPI}
                onDeleteAPI={handleDeleteAPI}
                onUpdateAPI={handleUpdateAPI}
                isEditMode={isEditMode}
                isMobile={false}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )
          } />
          <Route path="/calendar" element={
            <CalendarView 
              apis={apis}
              categories={categories}
              onEditAPI={handleEditAPI}
            />
          } />
          <Route path="/share/:data" element={<ShareImport />} />
        </Routes>
        
        {showAPIModal && (
          <APIModal
            api={editingAPI}
            categories={categories}
            onSave={handleSaveAPI}
            onClose={() => setShowAPIModal(false)}
          />
        )}
        
        {showSettingsModal && (
          isTouchDevice ? (
            <MobileSettingsModal
              settings={settings}
              apis={apis}
              categories={categories}
              onSave={handleSaveSettings}
              onClose={() => setShowSettingsModal(false)}
            />
          ) : (
            <SettingsModal
              settings={settings}
              apis={apis}
              categories={categories}
              onSave={handleSaveSettings}
              onClose={() => setShowSettingsModal(false)}
            />
          )
        )}
        
        {showCategoryManager && (
          <CategoryManager
            categories={categories}
            onSave={handleSaveCategories}
            onClose={() => setShowCategoryManager(false)}
          />
        )}
        
        {deleteConfirm.show && (
          <ConfirmModal
            title="Delete API"
            message="Are you sure you want to delete this API? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm({ show: false, id: null })}
          />
        )}
        
        {bulkDeleteConfirm && (
          <ConfirmModal
            title="Delete Selected Subscriptions"
            message={`Are you sure you want to delete ${selectedIds.size} subscription${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
            confirmText="Delete All"
            cancelText="Cancel"
            type="danger"
            onConfirm={confirmBulkDelete}
            onCancel={() => setBulkDeleteConfirm(false)}
          />
        )}
        
        {showAIModal === 'menu' && (
          <AIMenu
            onOpenSettings={() => {
              setShowAIModal('settings');
            }}
            onOpenRecommendations={() => {
              setShowAIModal('recommendations');
            }}
            onClose={() => setShowAIModal(null)}
          />
        )}
        
        {showAIModal === 'settings' && (
          <AISettings
            onClose={() => setShowAIModal(null)}
          />
        )}
        
        {showAIModal === 'recommendations' && (
          <AIRecommendations
            apis={apis}
            onClose={() => setShowAIModal(null)}
          />
        )}
        
        {isEditMode && selectedIds.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedIds.size}
            totalCount={apis.length}
            categories={categories}
            onDelete={handleBulkDelete}
            onCategoryChange={handleBulkCategoryChange}
            onExport={handleBulkExport}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
          />
        )}
        
        {showBulkExportOptions && (
          <ExportOptionsModal
            selectedCount={selectedIds.size}
            onExportWithPassword={() => {
              setShowBulkExportOptions(false);
              setShowBulkExportPasswordModal(true);
            }}
            onExportWithoutPassword={handleBulkExportWithoutPassword}
            onClose={() => setShowBulkExportOptions(false)}
          />
        )}
        
        {showBulkExportPasswordModal && (
          <PasswordModal
            title="Set Export Password"
            description="Enter a password to encrypt your export file:"
            onConfirm={handleBulkExportWithPassword}
            onCancel={() => setShowBulkExportPasswordModal(false)}
          />
        )}
        </>
        )}
        <Analytics />
      </div>
    </Router>
  );
}

export default App;
