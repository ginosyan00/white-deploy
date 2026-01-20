'use client';

import React, { HTMLAttributes, forwardRef, ReactElement } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className = '', children, ...props }, ref): ReactElement {
    return (
      <div
        ref={ref}
        className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

