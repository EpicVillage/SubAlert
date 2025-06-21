import React, { useState } from 'react';
import { API, Category } from '../types';
import { PDFReportGenerator, PDFReportOptions } from '../utils/pdfReportGenerator';
import { useNotification } from '../hooks/useNotification';
import './PDFExportModal.css';

interface PDFExportModalProps {
  apis: API[];
  categories: Category[];
  onClose: () => void;
}

const PDFExportModal: React.FC<PDFExportModalProps> = ({ apis, categories, onClose }) => {
  const { showNotification } = useNotification();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [options, setOptions] = useState<PDFReportOptions>({
    type: 'summary',
    includeCharts: true,
    includeNotes: true,
    pageSize: 'a4',
    title: 'SubAlert Report',
    subtitle: ''
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    enabled: false,
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: '📊', description: 'Overview with key statistics' },
    { value: 'detailed', label: 'Detailed Report', icon: '📋', description: 'Full details for each subscription' },
    { value: 'financial', label: 'Financial Report', icon: '💰', description: 'Cost analysis and spending breakdown' },
    { value: 'renewal', label: 'Renewal Report', icon: '📅', description: 'Upcoming renewals and timeline' },
    { value: 'category', label: 'Category Report', icon: '🏷️', description: 'Grouped by categories with analysis' }
  ];

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdfOptions: PDFReportOptions = {
        ...options,
        selectedCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        dateRange: dateRange.enabled ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      };
      
      const generator = new PDFReportGenerator(pdfOptions);
      const pdfBlob = await generator.generateReport(apis, categories, pdfOptions);
      
      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subalert-${options.type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('success', 'Report Generated', 'Your PDF report has been downloaded');
      onClose();
    } catch (error) {
      showNotification('error', 'Generation Failed', 'Failed to generate PDF report');
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pdf-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate PDF Report</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="pdf-export-content">
          {/* Report Type Selection */}
          <div className="pdf-section">
            <h3>Report Type</h3>
            <div className="report-type-grid">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  className={`report-type-card ${options.type === type.value ? 'selected' : ''}`}
                  onClick={() => setOptions({ ...options, type: type.value as any })}
                >
                  <div className="report-type-icon">{type.icon}</div>
                  <div className="report-type-info">
                    <h4>{type.label}</h4>
                    <p>{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Details */}
          <div className="pdf-section">
            <h3>Report Details</h3>
            <div className="pdf-form">
              <div className="form-group">
                <label>Report Title</label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => setOptions({ ...options, title: e.target.value })}
                  placeholder="Enter report title"
                />
              </div>
              
              <div className="form-group">
                <label>Subtitle (Optional)</label>
                <input
                  type="text"
                  value={options.subtitle}
                  onChange={(e) => setOptions({ ...options, subtitle: e.target.value })}
                  placeholder="Enter subtitle"
                />
              </div>
              
              <div className="form-group">
                <label>Page Size</label>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions({ ...options, pageSize: e.target.value as 'a4' | 'letter' })}
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="pdf-section">
            <h3>Options</h3>
            <div className="pdf-options">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions({ ...options, includeCharts: e.target.checked })}
                />
                <span>Include charts and visualizations</span>
              </label>
              
              {options.type === 'detailed' && (
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={options.includeNotes}
                    onChange={(e) => setOptions({ ...options, includeNotes: e.target.checked })}
                  />
                  <span>Include subscription notes</span>
                </label>
              )}
              
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={dateRange.enabled}
                  onChange={(e) => setDateRange({ ...dateRange, enabled: e.target.checked })}
                />
                <span>Filter by date range</span>
              </label>
              
              {dateRange.enabled && (
                <div className="date-range-inputs">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="pdf-section">
            <h3>Filter by Categories</h3>
            <p className="section-description">Leave empty to include all categories</p>
            <div className="category-filter-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-filter-chip ${selectedCategories.includes(category.id) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    borderColor: selectedCategories.includes(category.id) ? category.color : 'transparent',
                    backgroundColor: selectedCategories.includes(category.id) ? `${category.color}20` : 'transparent'
                  }}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pdf-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;