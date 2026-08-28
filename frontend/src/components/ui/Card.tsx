import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  // Replace white background references with dark surface styling if present in className
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
    .replace(/\btext-gray-500\b/g, 'text-slate-400')

  return (
    <div className={`bg-[#111827] rounded-lg border border-slate-800 text-slate-100 ${cleanedClass}`}>
      {children}
    </div>
  );
};
