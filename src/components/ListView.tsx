import React, { useState } from 'react';
import { API, Category } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { getCategoryById } from '../utils/categories';
import { getNextBillingDate, shouldShowAsRenewal } from '../utils/billing';

interface ListViewProps {
  apis: API[];
  categories: Category[];
  onEditAPI: (api: API) => void;
  onDeleteAPI: (id: string) => void;
  isEditMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  expandedRows?: Set<string>;
  onExpandedRowsChange?: (rows: Set<string>) => void;
}

const ListView: React.FC<ListViewProps> = ({ 
  apis, 
  categories, 
  onEditAPI, 
  onDeleteAPI, 
  isEditMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  expandedRows: externalExpandedRows,
  onExpandedRowsChange
}) => {
  const [sortField, setSortField] = useState<'name' | 'category' | 'cost' | 'expiry'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [internalExpandedRows, setInternalExpandedRows] = useState<Set<string>>(new Set());
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [copiedApiKeys, setCopiedApiKeys] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Use external state if provided, otherwise use internal state
  const expandedRows = externalExpandedRows ?? internalExpandedRows;
  const setExpandedRows = onExpandedRowsChange ?? setInternalExpandedRows;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const sortedApis = [...apis].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortField) {
      case 'name':
        aVal = a.serviceName.toLowerCase();
        bVal = b.serviceName.toLowerCase();
        break;
      case 'category':
        const catA = getCategoryById(categories, a.category);
        const catB = getCategoryById(categories, b.category);
        aVal = catA?.name || '';
        bVal = catB?.name || '';
        break;
      case 'cost':
        aVal = a.cost || 0;
        bVal = b.cost || 0;
        // Convert to monthly for comparison
        if (a.billingCycle === 'yearly') aVal /= 12;
        if (b.billingCycle === 'yearly') bVal /= 12;
        break;
      case 'expiry':
        aVal = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        bVal = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        break;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getDaysLeft = (api: API) => {
    if (!api.expiryDate) return null;
    
    if (shouldShowAsRenewal(api)) {
      const nextBilling = getNextBillingDate(api.expiryDate, api.billingCycle);
      if (nextBilling) {
        return differenceInDays(nextBilling, new Date());
      }
    }
    
    return differenceInDays(parseISO(api.expiryDate), new Date());
  };

  const getExpiryDisplay = (api: API) => {
    const daysLeft = getDaysLeft(api);
    const isRenewal = shouldShowAsRenewal(api);
    
    if (daysLeft === null) return { text: 'No expiry', className: '' };
    
    if (daysLeft < 0 && !isRenewal) {
      return { text: `Expired ${Math.abs(daysLeft)} days ago`, className: 'text-danger' };
    }
    
    if (daysLeft <= 7) {
      return { text: `${isRenewal ? 'Renews' : 'Expires'} in ${daysLeft} days`, className: 'text-warning' };
    }
    
    return { text: `${isRenewal ? 'Renews' : 'Expires'} in ${daysLeft} days`, className: '' };
  };

  return (
    <div className="list-view">
      <table className="list-table">
        <thead>
          <tr>
            {isEditMode && (
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  className="selection-checkbox"
                  checked={selectedIds.size === apis.length && apis.length > 0}
                  onChange={() => {
                    if (selectedIds.size === apis.length) {
                      // Deselect all
                      apis.forEach(api => onToggleSelect?.(api.id));
                    } else {
                      // Select all
                      apis.forEach(api => {
                        if (!selectedIds.has(api.id)) {
                          onToggleSelect?.(api.id);
                        }
                      });
                    }
                  }}
                />
              </th>
            )}
            <th 
              className="sortable"
              onClick={() => handleSort('name')}
            >
              Service Name
              {sortField === 'name' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
              )}
            </th>
            <th 
              className="sortable"
              onClick={() => handleSort('category')}
            >
              Category
              {sortField === 'category' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
              )}
            </th>
            <th 
              className="sortable"
              onClick={() => handleSort('cost')}
            >
              Cost
              {sortField === 'cost' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
              )}
            </th>
            <th 
              className="sortable"
              onClick={() => handleSort('expiry')}
            >
              Expiry/Renewal
              {sortField === 'expiry' && (
                <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
              )}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedApis.map(api => {
            const category = getCategoryById(categories, api.category) || {
              id: 'other',
              name: 'Other',
              color: '#6b7280',
              emoji: '📦',
              isCustom: false
            };
            const expiry = getExpiryDisplay(api);
            const isExpanded = expandedRows.has(api.id);
            
            return (
              <React.Fragment key={api.id}>
                <tr 
                  className={`list-row ${isEditMode && selectedIds.has(api.id) ? 'selected' : ''}`}
                  onClick={(e) => {
                    // Don't expand if clicking on buttons or inputs
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
                      return;
                    }
                    toggleRowExpansion(api.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {isEditMode && (
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        className="selection-checkbox"
                        checked={selectedIds.has(api.id)}
                        onChange={() => onToggleSelect?.(api.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  <td>
                    <div className="service-name-cell">
                      <button 
                        className="expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(api.id);
                        }}
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <span className="service-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {api.logo && (
                          <img 
                            src={api.logo} 
                            alt={`${api.serviceName} logo`}
                            style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {api.serviceName}
                      </span>
                      {api.subscriptionType === 'free' && (
                        <span className="badge badge-free">FREE</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="category-cell" style={{ color: category.color }}>
                      <span>{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                  </td>
                  <td>
                    {api.subscriptionType === 'paid' && api.cost ? (
                      <span className="cost-cell">
                        ${api.cost}
                        <span className="billing-cycle">/{api.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </span>
                    ) : (
                      <span className="cost-cell free">-</span>
                    )}
                  </td>
                  <td>
                    <span className={expiry.className}>
                      {api.expiryDate ? (
                        <>
                          {format(
                            shouldShowAsRenewal(api) && api.billingCycle
                              ? getNextBillingDate(api.expiryDate, api.billingCycle)!
                              : parseISO(api.expiryDate),
                            'MMM dd, yyyy'
                          )}
                          <br />
                          <small>{expiry.text}</small>
                        </>
                      ) : (
                        <span className="no-expiry">No expiry</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {isEditMode && (
                        <>
                          <button 
                            className="btn-icon-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAPI(api);
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-small delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAPI(api.id);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="expanded-row">
                    <td colSpan={isEditMode ? 6 : 5}>
                      <div className="expanded-content">
                        {api.serviceDescription && (
                          <div className="detail-item">
                            <strong>Description:</strong> {api.serviceDescription}
                          </div>
                        )}
                        {api.website && (
                          <div className="detail-item">
                            <strong>Website:</strong> <a href={api.website} target="_blank" rel="noopener noreferrer">{api.website}</a>
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Email:</strong> {api.email}
                        </div>
                        {api.apiKey && (
                          <div className="detail-item">
                            <strong>API Key:</strong>
                            <div className="api-key-display" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="masked">{showApiKeys[api.id] ? api.apiKey : '••••••••'}</span>
                              <div className="api-key-actions" style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                <button 
                                  className={`btn-icon-small ${copiedApiKeys[api.id] ? 'copied' : ''}`}
                                  onClick={() => {
                                    navigator.clipboard.writeText(api.apiKey);
                                    setCopiedApiKeys({ ...copiedApiKeys, [api.id]: true });
                                    setTimeout(() => {
                                      setCopiedApiKeys(prev => ({ ...prev, [api.id]: false }));
                                    }, 2000);
                                  }}
                                  title={copiedApiKeys[api.id] ? "Copied!" : "Copy to clipboard"}
                                  style={{ padding: '0.25rem', minWidth: '28px', height: '28px' }}
                                >
                                  {copiedApiKeys[api.id] ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                                      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                  )}
                                </button>
                                <button 
                                  className="btn-icon-small"
                                  onClick={() => setShowApiKeys({ ...showApiKeys, [api.id]: !showApiKeys[api.id] })}
                                  title={showApiKeys[api.id] ? 'Hide' : 'Show'}
                                  style={{ padding: '0.25rem', minWidth: '28px', height: '28px' }}
                                >
                                  {showApiKeys[api.id] ? '🙈' : '👁️'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {api.websocketUrl && (
                          <div className="detail-item">
                            <strong>WebSocket URL:</strong> <span className="masked">••••••••</span>
                          </div>
                        )}
                        {api.customFields && api.customFields.length > 0 && (
                          <div className="detail-item">
                            <strong>Custom Fields:</strong>
                            {api.customFields.map((field, idx) => (
                              <div key={idx} className="custom-field-item">
                                {field.name}: {field.isSensitive ? <span className="masked">••••••••</span> : field.value}
                              </div>
                            ))}
                          </div>
                        )}
                        {api.notes && (
                          <div className="detail-item">
                            <strong>Notes:</strong>
                            <div className="api-notes-container" style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
                              <span className={`api-notes ${!expandedNotes.has(api.id) ? 'api-notes-collapsed' : ''}`}>
                                {api.notes!.split('\n').map((line, index, array) => (
                                  <React.Fragment key={index}>
                                    {line}
                                    {index < array.length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </span>
                              {api.notes!.split('\n').length > 3 && (
                                <button 
                                  className="notes-toggle-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newExpanded = new Set(expandedNotes);
                                    if (newExpanded.has(api.id)) {
                                      newExpanded.delete(api.id);
                                    } else {
                                      newExpanded.add(api.id);
                                    }
                                    setExpandedNotes(newExpanded);
                                  }}
                                  style={{ marginLeft: '0.5rem' }}
                                >
                                  {expandedNotes.has(api.id) ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {api.autoRenews !== undefined && api.subscriptionType === 'paid' && (
                          <div className="detail-item">
                            <strong>Auto-renews:</strong> {api.autoRenews ? '✓ Yes' : '✗ No'}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {apis.length === 0 && (
        <div className="empty-state">
          <p>No subscriptions found</p>
        </div>
      )}
    </div>
  );
};

export default ListView;