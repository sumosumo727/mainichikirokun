import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg hover:border-gray-300',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};