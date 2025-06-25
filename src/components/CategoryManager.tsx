import React, { useState } from 'react';
import { Category } from '../types';
import { generateCategoryId } from '../utils/categories';
import ConfirmModal from './ConfirmModal';

interface CategoryManagerProps {
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onSave, onClose }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3b82f6', emoji: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState({ name: '', color: '#3b82f6', emoji: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  const handleEdit = (id: string) => {
    const category = localCategories.find(cat => cat.id === id);
    if (category) {
      setEditingId(id);
      setEditCategory({ name: category.name, color: category.color, emoji: category.emoji || '' });
    }
  };

  const handleSaveEdit = () => {
    if (editingId && editCategory.name.trim()) {
      setLocalCategories(cats => 
        cats.map(cat => cat.id === editingId ? { 
          ...cat, 
          name: editCategory.name.trim(),
          color: editCategory.color,
          emoji: editCategory.emoji || cat.emoji
        } : cat)
      );
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      setLocalCategories(cats => cats.filter(cat => cat.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: generateCategoryId(),
        name: newCategory.name.trim(),
        color: newCategory.color,
        emoji: newCategory.emoji || '📌',
        isCustom: true
      };
      setLocalCategories([...localCategories, category]);
      setNewCategory({ name: '', color: '#3b82f6', emoji: '' });
      setShowAddForm(false);
    }
  };

  const handleSaveAll = () => {
    onSave(localCategories);
  };

  const colorPresets = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
  ];
  const emojiPresets = ['📁', '⭐', '🚀', '💡', '🎯'];

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="category-manager">
          <div className="category-list">
            {localCategories.map(category => (
              <div key={category.id} className="category-item">
                <div className="category-info">
                  <div 
                    className="category-color-badge" 
                    style={{ backgroundColor: category.color }}
                  >
                    {category.emoji}
                  </div>
                  <span className="category-name">{category.name}</span>
                </div>
                <div className="category-actions">
                  <button 
                    className="btn-icon-small" 
                    onClick={() => handleEdit(category.id)}
                    title="Edit"
                    disabled={showAddForm || editingId !== null}
                  >
                    ✏️
                  </button>
                  {category.isCustom && (
                    <button 
                      className="btn-icon-small" 
                      onClick={() => handleDelete(category.id)}
                      title="Delete"
                      disabled={showAddForm || editingId !== null}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editingId ? (
            <div className="add-category-form-modern">
              <h3>Edit Category</h3>
              
              <div className="form-section">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  autoFocus
                  className="category-name-input"
                />
              </div>

              <div className="form-section">
                <label>Color</label>
                <div className="color-grid">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      className={`preset-button color-preset ${editCategory.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditCategory({ ...editCategory, color })}
                    />
                  ))}
                  <div className="color-picker-wrapper">
                    <button
                      className="preset-button custom-button color-custom"
                      onClick={() => document.getElementById('edit-color-picker')?.click()}
                      title="Custom color"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L13.84 6.41L11.91 4.48L10.5 5.89L12.43 7.82L3 17.25V21H6.75L16.18 11.57L18.11 13.5L19.52 12.09L17.59 10.16L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63ZM5.91 19H5V18.09L14.84 8.25L15.75 9.16L5.91 19Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <input
                      id="edit-color-picker"
                      type="color"
                      value={editCategory.color}
                      onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                      className="hidden-color-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label>Emoji</label>
                <div className="emoji-grid">
                  {emojiPresets.map(emoji => (
                    <button
                      key={emoji}
                      className={`preset-button emoji-preset ${editCategory.emoji === emoji ? 'selected' : ''}`}
                      onClick={() => setEditCategory({ ...editCategory, emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    className="preset-button custom-button"
                    onClick={() => {
                      const emoji = prompt('Enter an emoji:', editCategory.emoji);
                      if (emoji) setEditCategory({ ...editCategory, emoji: emoji.slice(0, 2) });
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>+</span>
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => {
                  setEditingId(null);
                  setEditCategory({ name: '', color: '#3b82f6', emoji: '' });
                }}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveEdit}
                  disabled={!editCategory.name.trim()}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : showAddForm ? (
            <div className="add-category-form-modern">
              <h3>Create New Category</h3>
              
              <div className="form-section">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  autoFocus
                  className="category-name-input"
                />
              </div>

              <div className="form-section">
                <label>Color</label>
                <div className="color-grid">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      className={`preset-button color-preset ${newCategory.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                  <div className="color-picker-wrapper">
                    <button
                      className="preset-button custom-button color-custom"
                      onClick={() => document.getElementById('color-picker')?.click()}
                      title="Custom color"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L13.84 6.41L11.91 4.48L10.5 5.89L12.43 7.82L3 17.25V21H6.75L16.18 11.57L18.11 13.5L19.52 12.09L17.59 10.16L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63ZM5.91 19H5V18.09L14.84 8.25L15.75 9.16L5.91 19Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <input
                      id="color-picker"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="hidden-color-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label>Emoji</label>
                <div className="emoji-grid">
                  {emojiPresets.map(emoji => (
                    <button
                      key={emoji}
                      className={`preset-button emoji-preset ${newCategory.emoji === emoji ? 'selected' : ''}`}
                      onClick={() => setNewCategory({ ...newCategory, emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    className="preset-button custom-button"
                    onClick={() => {
                      const emoji = prompt('Enter an emoji:');
                      if (emoji) setNewCategory({ ...newCategory, emoji: emoji.slice(0, 2) });
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>+</span>
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => {
                  setShowAddForm(false);
                  setNewCategory({ name: '', color: '#3b82f6', emoji: '' });
                }}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddCategory}
                  disabled={!newCategory.name.trim()}
                >
                  Create Category
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="btn btn-primary add-category-btn" 
              onClick={() => setShowAddForm(true)}
              disabled={editingId !== null}
            >
              + Add Custom Category
            </button>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={showAddForm || editingId !== null}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSaveAll}
              disabled={showAddForm || editingId !== null}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      {deleteConfirm.show && (
        <ConfirmModal
          title="Delete Category"
          message="Are you sure you want to delete this category? APIs using this category will be moved to 'Other'."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null })}
        />
      )}
    </div>
  );
};

export default CategoryManager;