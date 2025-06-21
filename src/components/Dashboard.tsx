import React, { useState, useEffect } from 'react';
import { API, Category } from '../types';
import APICard from './APICard';
import CategoryView from './CategoryView';
import Stats from './Stats';
import { differenceInDays, parseISO } from 'date-fns';

interface DashboardProps {
  apis: API[];
  categories: Category[];
  onEditAPI: (api: API) => void;
  onDeleteAPI: (id: string) => void;
  onUpdateAPI?: (api: API) => void;
  isEditMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ apis, categories, onEditAPI, onDeleteAPI, onUpdateAPI, isEditMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'paid' | 'free'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'category'>('grid');
  const [filteredAPIs, setFilteredAPIs] = useState<API[]>(apis);

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
    .filter(api => api.subscriptionType === 'paid' && api.cost)
    .reduce((total, api) => {
      if (api.billingCycle === 'yearly') {
        return total + (api.cost! / 12);
      }
      return total + api.cost!;
    }, 0);

  return (
    <div className="dashboard">
      <Stats
        totalApis={apis.length}
        expiringSoon={expiringCount}
        monthlyCost={monthlyCost}
      />

      <div className="filter-section">
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
        </div>
        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="all">All APIs</option>
          <option value="expiring">Expiring Soon</option>
          <option value="paid">Paid</option>
          <option value="free">Free</option>
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="api-grid">
          {filteredAPIs.map(api => (
            <APICard
              key={api.id}
              api={api}
              categories={categories}
              onEdit={() => onEditAPI(api)}
              onDelete={() => onDeleteAPI(api.id)}
              isEditMode={isEditMode}
            />
          ))}
          {filteredAPIs.length === 0 && (
            <div className="empty-state">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 5" opacity="0.2"/>
                <path d="M45 60L55 70L75 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
              </svg>
              <p>No APIs found. {apis.length === 0 ? 'Add your first API to get started!' : 'Try adjusting your filters.'}</p>
            </div>
          )}
        </div>
      ) : (
        <CategoryView
          apis={filteredAPIs}
          categories={categories}
          onEditAPI={onEditAPI}
          onDeleteAPI={onDeleteAPI}
          onUpdateAPI={onUpdateAPI || ((updatedAPI) => onEditAPI(updatedAPI))}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
};

export default Dashboard;