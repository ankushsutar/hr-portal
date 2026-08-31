import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const Card = ({ children, className = '', onClick, title, description, action }: CardProps) => {
  const cleanedClass = className
    .replace(/\bbg-white\b/g, 'bg-[var(--bg-card)]')
    .replace(/\bbg-[#111827]\b/g, 'bg-[var(--bg-card)]')
    .replace(/\bbg-gray-50\b/g, 'bg-[var(--bg-subtle)]')
    .replace(/\bborder-gray-100\b/g, 'border-[var(--border-color)]')
    .replace(/\bborder-gray-200\b/g, 'border-[var(--border-color)]')
    .replace(/\bborder-slate-800\b/g, 'border-[var(--border-color)]')
    .replace(/\btext-gray-900\b/g, 'text-[var(--text-main)]')
    .replace(/\btext-gray-500\b/g, 'text-[var(--text-muted)]');

  return (
    <div 
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] text-[var(--text-main)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] ${onClick ? 'cursor-pointer hover:border-[var(--color-primary)]' : ''} ${cleanedClass}`}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-[var(--text-main)] text-sm tracking-tight">{title}</h3>}
            {description && <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
