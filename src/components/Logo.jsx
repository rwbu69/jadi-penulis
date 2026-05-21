import React from 'react';

const Logo = ({ size = 'md', className = '', hideText = false }) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', text: 'text-base', desc: 'text-[8px]', gap: 'gap-2' },
    md: { box: 'w-12 h-12', text: 'text-xl', desc: 'text-[10px]', gap: 'gap-3' },
    lg: { box: 'w-20 h-20', text: 'text-3xl', desc: 'text-xs', gap: 'gap-4' },
    xl: { box: 'w-28 h-28', text: 'text-4xl', desc: 'text-sm', gap: 'gap-5' }
  };
  
  const current = dimensions[size] || dimensions.md;

  return (
    <div className={`flex items-center ${current.gap} ${className}`}>
      {/* Black Circle Logo Icon */}
      <div className={`${current.box} bg-black rounded-full flex items-center justify-center flex-shrink-0 group hover:scale-105 transition-transform duration-300 shadow-sm`}>
        <span className="text-white font-serif font-black select-none" style={{ fontSize: size === 'sm' ? '14px' : size === 'md' ? '20px' : size === 'lg' ? '32px' : '44px' }}>
          A
        </span>
      </div>
      
      {/* Brand Text */}
      {!hideText && (
        <div className="flex flex-col">
          <span className={`font-serif font-black text-slate-800 tracking-tight leading-none ${current.text}`}>
            AKAL
          </span>
          <span className={`font-bold text-indigo-600 uppercase tracking-widest leading-none mt-1 ${current.desc}`}>
            Aksara | Karsa | Logika
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
