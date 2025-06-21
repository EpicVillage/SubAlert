import React, { useState } from 'react';
import { API, Category } from '../types';
import { useSwipe } from '../hooks/useTouch';
import APICard from './APICard';
import './MobileAPICard.css';

interface MobileAPICardProps {
  api: API;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  isEditMode?: boolean;
}

const MobileAPICard: React.FC<MobileAPICardProps> = ({ api, categories, onEdit, onDelete, isEditMode }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (swipeOffset === 0) {
        setSwipeOffset(-100);
      } else if (swipeOffset > 0) {
        setSwipeOffset(0);
      }
    },
    onSwipeRight: () => {
      if (swipeOffset === 0) {
        setSwipeOffset(100);
      } else if (swipeOffset < 0) {
        setSwipeOffset(0);
      }
    },
    threshold: 30,
  });

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  const handleEdit = () => {
    setSwipeOffset(0);
    onEdit();
  };

  return (
    <div className={`mobile-api-card-wrapper ${isDeleting ? 'deleting' : ''}`}>
      <div className="swipe-actions swipe-actions-left">
        <button className="swipe-action edit" onClick={handleEdit}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.50001C19.3284 1.67158 20.6716 1.67158 21.5 2.50001C22.3284 3.32844 22.3284 4.67158 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit
        </button>
      </div>
      <div className="swipe-actions swipe-actions-right">
        <button className="swipe-action delete" onClick={handleDelete}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
      <div 
        className="mobile-api-card-content"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        {...swipeHandlers}
      >
        <APICard 
          api={api} 
          categories={categories} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          isEditMode={false}
        />
      </div>
    </div>
  );
};

export default MobileAPICard;