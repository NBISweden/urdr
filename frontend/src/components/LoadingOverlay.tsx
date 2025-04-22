import React from 'react';
import "../index.css";


interface LoadingOverlayProps {
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ children }) => {
  return (
    <div className="loading-overlay">
      {children}
    </div>
  );
};