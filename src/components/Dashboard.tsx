import React, { useState, useEffect } from 'react';
import { API, Category } from '../types';
import APICard from './APICard';
import CompactAPICard from './CompactAPICard';
import MobileAPICard from './MobileAPICard';
import DividerCard from './DividerCard';
import CategoryView from './CategoryView';
import ListView from './ListView';
import Stats from './Stats';
import { differenceInDays, parseISO } from 'date-fns';
import BottomSheet from './BottomSheet';

interface DashboardProps {
  apis: API[];
  categories: Category[];
  onEditAPI: (api: API) => void;
  onDeleteAPI: (id: string) => void;
  onUpdateAPI?: (api: API) => void;
  onReorderAPIs?: (apis: API[]) => void;
  isEditMode?: boolean;
  isMobile?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ apis, categories, onEditAPI, onDeleteAPI, onUpdateAPI, onReorderAPIs, isEditMode = false, isMobile = false, selectedIds = new Set(), onToggleSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'paid' | 'free'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'category' | 'list'>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as 'grid' | 'category' | 'list') || 'grid';
  });
  const [filteredAPIs, setFilteredAPIs] = useState<API[]>(apis);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('compactMode');
    return saved === 'true';
  });
  const [draggedItem, setDraggedItem] = useState<API | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('compactMode', isCompactMode.toString());
  }, [isCompactMode]);

  useEffect(() => {
    let filtered = apis;

    if (searchTerm) {
      filtered = filtered.filter(api =>
        api.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterType) {
      case 'expiring':
        filtered = filtered.filter(api => {
          if (!api.expiryDate) return false;
          const daysLeft = differenceInDays(parseISO(api.expiryDate), new Date());
          return daysLeft > 0 && daysLeft <= 30;
        });
        break;
      case 'paid':
        filtered = filtered.filter(api => api.subscriptionType === 'paid');
        break;
      case 'free':
        filtered = filtered.filter(api => api.subscriptionType === 'free');
        break;
    }

    setFilteredAPIs(filtered);
  }, [apis, searchTerm, filterType]);

  const expiringCount = apis.filter(api => {
    if (!api.expiryDate) return false;
    const daysLeft = differenceInDays(parseISO(api.expiryDate), new Date());
    return daysLeft > 0 && daysLeft <= 7;
  }).length;

  const monthlyCost = apis
    .filter(api => api.subscriptionType === 'paid' && api.cost && api.billingCycle !== 'one-time')
    .reduce((total, api) => {
      if (api.billingCycle === 'yearly') {
        return total + (api.cost! / 12);
      }
      return total + api.cost!;
    }, 0);


  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, api: API, index: number) => {
    setDraggedItem(api);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedItem && draggedItem.type !== 'divider' && dragIndex !== dropIndex) {
      const newFilteredAPIs = [...filteredAPIs];
      
      // Remove the dragged item
      newFilteredAPIs.splice(dragIndex, 1);
      
      // Calculate the new index after removal
      let targetIndex = dropIndex;
      if (dragIndex < dropIndex) {
        targetIndex--;
      }
      
      // Insert at the new position
      newFilteredAPIs.splice(targetIndex, 0, draggedItem);
      setFilteredAPIs(newFilteredAPIs);
      
      // If we're viewing all items (no filter), update the global order
      if (filterType === 'all' && searchTerm === '' && onReorderAPIs) {
        const allAPIsMap = new Map(apis.map(api => [api.id, api]));
        const orderedAPIs: API[] = [];
        
        newFilteredAPIs.forEach(api => {
          orderedAPIs.push(api);
          allAPIsMap.delete(api.id);
        });
        
        allAPIsMap.forEach(api => orderedAPIs.push(api));
        onReorderAPIs(orderedAPIs);
      }
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div className="dashboard">
      <Stats
        totalApis={apis.length}
        expiringSoon={expiringCount}
        monthlyCost={monthlyCost}
      />

      <div className="filter-section">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
              <rect x="12" y="2" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="12" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
              <rect x="12" y="12" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'category' ? 'active' : ''}`}
            onClick={() => setViewMode('category')}
            title="Category View"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="16" height="4" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="8" width="16" height="4" stroke="currentColor" strokeWidth="2"/>
              <rect x="2" y="14" width="16" height="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="16" height="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="2" y="9" width="16" height="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="2" y="15" width="16" height="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          </div>
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {expandedRows.size < filteredAPIs.length && (
                <button 
                  className="btn btn-sm btn-secondary expand-collapse-btn"
                  onClick={() => {
                    const allIds = new Set(filteredAPIs.map(api => api.id));
                    setExpandedRows(allIds);
                  }}
                  title="Expand all rows"
                >
                  Expand All
                </button>
              )}
              {expandedRows.size > 0 && (
                <button 
                  className="btn btn-sm btn-secondary expand-collapse-btn"
                  onClick={() => setExpandedRows(new Set())}
                  title="Collapse all expanded rows"
                >
                  Collapse All ({expandedRows.size})
                </button>
              )}
            </div>
          )}
          {viewMode === 'grid' && (
            <button 
              className={`btn btn-sm btn-secondary compact-mode-btn ${isCompactMode ? 'active' : ''}`}
              onClick={() => setIsCompactMode(!isCompactMode)}
              title={isCompactMode ? "Switch to normal view" : "Switch to compact view"}
            >
              {isCompactMode ? 'Normal' : 'Compact'}
            </button>
          )}
        </div>
        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Subs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isMobile ? (
          <button
            className="filter-select mobile-filter-btn"
            onClick={() => setShowFilterMenu(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {filterType === 'all' ? 'Filter' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ) : (
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Subs</option>
            <option value="expiring">Expiring Soon</option>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className={`api-grid ${isCompactMode ? 'compact-grid' : ''}`}>
          {(() => {
            const itemsWithPlaceholders: (API | { id: string; type: 'placeholder'; index: number })[] = [];
            let currentSectionStart = 0;
            
            filteredAPIs.forEach((api, index) => {
              if (api.type === 'divider') {
                // Add placeholders to fill the previous section (but not before the first divider)
                if (isEditMode && index > 0) {
                  const sectionItems = itemsWithPlaceholders.slice(currentSectionStart);
                  const nonDividerCount = sectionItems.filter(item => item.type !== 'divider' && item.type !== 'placeholder').length;
                  const gridColumns = isCompactMode ? 5 : 3; // Approximate columns based on mode
                  const placeholdersNeeded = nonDividerCount > 0 ? (gridColumns - (nonDividerCount % gridColumns)) % gridColumns : 0;
                  
                  for (let i = 0; i < placeholdersNeeded; i++) {
                    itemsWithPlaceholders.push({
                      id: `placeholder-${index}-${i}`,
                      type: 'placeholder',
                      index: index
                    });
                  }
                }
                
                itemsWithPlaceholders.push(api);
                currentSectionStart = itemsWithPlaceholders.length;
                
                // Check if this is the last item or if next item is also a divider
                const isLastItem = index === filteredAPIs.length - 1;
                const nextIsAlsoDivider = index < filteredAPIs.length - 1 && filteredAPIs[index + 1].type === 'divider';
                
                // Add placeholders for empty section after divider
                if (isEditMode && (isLastItem || nextIsAlsoDivider)) {
                  const gridColumns = isCompactMode ? 5 : 3;
                  for (let i = 0; i < gridColumns; i++) {
                    itemsWithPlaceholders.push({
                      id: `placeholder-after-${index}-${i}`,
                      type: 'placeholder',
                      index: index + 1
                    });
                  }
                  currentSectionStart = itemsWithPlaceholders.length;
                }
              } else {
                itemsWithPlaceholders.push(api);
              }
            });
            
            // Add placeholders for the last section (only if there's a section after the last divider)
            if (isEditMode && currentSectionStart < itemsWithPlaceholders.length) {
              const sectionItems = itemsWithPlaceholders.slice(currentSectionStart);
              const nonDividerCount = sectionItems.filter(item => item.type !== 'divider' && item.type !== 'placeholder').length;
              const gridColumns = isCompactMode ? 5 : 3;
              const placeholdersNeeded = nonDividerCount > 0 ? (gridColumns - (nonDividerCount % gridColumns)) % gridColumns : 0;
              
              for (let i = 0; i < placeholdersNeeded; i++) {
                itemsWithPlaceholders.push({
                  id: `placeholder-end-${i}`,
                  type: 'placeholder',
                  index: filteredAPIs.length
                });
              }
            }
            
            return itemsWithPlaceholders.map((item, displayIndex) => {
              if (item.type === 'placeholder') {
                return (
                  <div
                    key={item.id}
                    className={`placeholder-card ${dragOverIndex === item.index + 0.5 ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(item.index + 0.5);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(e, item.index);
                    }}
                  />
                );
              }
              
              const api = item as API;
              const actualIndex = filteredAPIs.findIndex(a => a.id === api.id);
              
              return (
                <div
                  key={api.id}
                  draggable={isEditMode && api.type !== 'divider'}
                  onDragStart={isEditMode ? (e) => handleDragStart(e, api, actualIndex) : undefined}
                  onDragEnd={isEditMode ? handleDragEnd : undefined}
                  onDragOver={isEditMode ? (e) => handleDragOver(e, actualIndex) : undefined}
                  onDragLeave={isEditMode ? handleDragLeave : undefined}
                  onDrop={isEditMode ? (e) => handleDrop(e, actualIndex) : undefined}
                  className={`draggable-card-wrapper ${dragOverIndex === actualIndex ? 'drag-over' : ''}`}
                >
              {api.type === 'divider' ? (
                <DividerCard
                  label={api.serviceName}
                  api={api}
                  isEditMode={isEditMode}
                  onEdit={(updatedApi) => onUpdateAPI?.(updatedApi)}
                  onDelete={() => onDeleteAPI(api.id)}
                  isCompact={isCompactMode}
                />
              ) : isMobile && !isCompactMode ? (
                <MobileAPICard
                  api={api}
                  categories={categories}
                  onEdit={() => onEditAPI(api)}
                  onDelete={() => onDeleteAPI(api.id)}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(api.id)}
                  onToggleSelect={() => onToggleSelect?.(api.id)}
                />
              ) : isCompactMode ? (
                <CompactAPICard
                  api={api}
                  categories={categories}
                  onEdit={() => onEditAPI(api)}
                  onDelete={() => onDeleteAPI(api.id)}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(api.id)}
                  onToggleSelect={() => onToggleSelect?.(api.id)}
                />
              ) : (
                <APICard
                  api={api}
                  categories={categories}
                  onEdit={() => onEditAPI(api)}
                  onDelete={() => onDeleteAPI(api.id)}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(api.id)}
                  onToggleSelect={() => onToggleSelect?.(api.id)}
                />
              )}
            </div>
              );
            });
          })()}
          {filteredAPIs.length === 0 && (
            <div className="empty-state">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 5" opacity="0.2"/>
                <path d="M45 60L55 70L75 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
              </svg>
              <p>No Subs found. {apis.length === 0 ? 'Add your first subscription to get started!' : 'Try adjusting your filters.'}</p>
            </div>
          )}
        </div>
      ) : viewMode === 'category' ? (
        <CategoryView
          apis={filteredAPIs}
          categories={categories}
          onEditAPI={onEditAPI}
          onDeleteAPI={onDeleteAPI}
          onUpdateAPI={onUpdateAPI || ((updatedAPI) => onEditAPI(updatedAPI))}
          isEditMode={isEditMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <ListView
          apis={filteredAPIs}
          categories={categories}
          onEditAPI={onEditAPI}
          onDeleteAPI={onDeleteAPI}
          isEditMode={isEditMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          expandedRows={expandedRows}
          onExpandedRowsChange={setExpandedRows}
        />
      )}
      
      {isMobile && (
        <BottomSheet
          isOpen={showFilterMenu}
          onClose={() => setShowFilterMenu(false)}
          title="Filter Subscriptions"
        >
          <div className="bottom-sheet-menu">
            <button
              className="bottom-sheet-menu-item"
              onClick={() => {
                setFilterType('all');
                setShowFilterMenu(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              All Subscriptions
            </button>
            <button
              className="bottom-sheet-menu-item"
              onClick={() => {
                setFilterType('expiring');
                setShowFilterMenu(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Expiring Soon
            </button>
            <button
              className="bottom-sheet-menu-item"
              onClick={() => {
                setFilterType('paid');
                setShowFilterMenu(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Paid Subscriptions
            </button>
            <button
              className="bottom-sheet-menu-item"
              onClick={() => {
                setFilterType('free');
                setShowFilterMenu(false);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69365 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69365 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61V4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Free Subscriptions
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default Dashboard;