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
    .replace(/\bbg-white\b/g, 'bg-[#111827]')
    .replace(/\bbg-gray-50\b/g, 'bg-[#161B26]')
    .replace(/\bbg-gray-50\/50\b/g, 'bg-[#161B26]')
    .replace(/\bbg-gray-50\/20\b/g, 'bg-[#161B26]/50')
    .replace(/\bborder-gray-100\b/g, 'border-slate-800')
    .replace(/\bborder-gray-200\b/g, 'border-slate-800')
    .replace(/\btext-gray-900\b/g, 'text-slate-100')
    .replace(/\btext-gray-800\b/g, 'text-slate-200')
    .replace(/\btext-gray-700\b/g, 'text-slate-300')
    .replace(/\btext-gray-600\b/g, 'text-slate-400')
    .replace(/\btext-gray-500\b/g, 'text-slate-400');

  return (
    <div 
      onClick={onClick}
      className={`bg-[#111827] rounded-lg border border-slate-800 text-slate-100 transition-all duration-150 ${onClick ? 'cursor-pointer hover:border-slate-700' : ''} ${cleanedClass}`}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-100 text-sm tracking-tight">{title}</h3>}
            {description && <p className="text-xs font-mono text-slate-400 mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
