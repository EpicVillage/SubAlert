import React, { useState } from 'react';
import APICard from './APICard';
import { API, Category } from '../types';

interface CategoryViewProps {
  apis: API[];
  categories: Category[];
  onEditAPI: (api: API) => void;
  onDeleteAPI: (id: string) => void;
  onUpdateAPI: (api: API) => void;
  isEditMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

interface CategorySection {
  name: string;
  category: string;
  items: API[];
  color: string;
  emoji: string;
}

const CategoryView: React.FC<CategoryViewProps> = ({ apis, categories, onEditAPI, onDeleteAPI, onUpdateAPI, isEditMode = false, selectedIds = new Set(), onToggleSelect }) => {
  const [draggedItem, setDraggedItem] = useState<API | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // Create sections from categories
  const categorySections: CategorySection[] = categories.map(cat => ({
    name: cat.name,
    category: cat.id,
    items: apis.filter(api => api.category === cat.id),
    color: cat.color,
    emoji: cat.emoji || '📦'
  })).filter(section => section.items.length > 0);


  const handleDragStart = (e: React.DragEvent, api: API) => {
    setDraggedItem(api);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    setDragOverCategory(null);

    if (draggedItem && draggedItem.category !== targetCategory) {
      const updatedAPI = { ...draggedItem, category: targetCategory };
      onUpdateAPI(updatedAPI);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const getEmptyCategoryMessage = (cat: Category) => {
    return (
      <div 
        className="empty-category"
        onDragOver={(e) => handleDragOver(e, cat.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, cat.id)}
      >
        <p>{cat.emoji} Drop APIs here</p>
      </div>
    );
  };

  return (
    <div className="category-view">
      {categorySections.map(section => (
        <div 
          key={section.category} 
          className={`category-section ${dragOverCategory === section.category ? 'drag-over' : ''}`}
        >
          <h2 className="category-header">
            {section.emoji} {section.name}
            <span className="category-count">{section.items.length}</span>
          </h2>
          <div 
            className="category-items"
            onDragOver={(e) => handleDragOver(e, section.category)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, section.category)}
          >
            {section.items.map(api => (
              <div
                key={api.id}
                draggable
                onDragStart={(e) => handleDragStart(e, api)}
                onDragEnd={handleDragEnd}
                className="draggable-item"
              >
                <APICard
                  api={api}
                  categories={categories}
                  onEdit={() => onEditAPI(api)}
                  onDelete={() => onDeleteAPI(api.id)}
                  isEditMode={isEditMode}
                  isSelected={selectedIds.has(api.id)}
                  onToggleSelect={() => onToggleSelect?.(api.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {categories.map(cat => {
        const hasItems = apis.some(api => api.category === cat.id);
        if (!hasItems) {
          return (
            <div 
              key={cat.id} 
              className={`category-section empty ${dragOverCategory === cat.id ? 'drag-over' : ''}`}
            >
              <h2 className="category-header">
                {cat.emoji} {cat.name}
                <span className="category-count">0</span>
              </h2>
              {getEmptyCategoryMessage(cat)}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default CategoryView;