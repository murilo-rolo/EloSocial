import React, { useEffect } from 'react';

export default function SlideOver({ isOpen, onClose, title, children, width = '800px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className={`slide-over-panel ${isOpen ? 'open' : ''}`} 
        style={{ width: width, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slide-over-header">
          <h2>{title}</h2>
          <button className="slide-over-close" onClick={onClose}>&times;</button>
        </div>
        <div className="slide-over-content">
          {children}
        </div>
      </div>
    </div>
  );
}
