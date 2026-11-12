import React from 'react';

interface JavenlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const JavenlyLogo: React.FC<JavenlyLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  theme = 'light',
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 'h-7 w-auto', text: 'text-base', sub: 'text-[9px]', tag: 'text-[10px]' },
    md: { img: 'h-10 w-auto', text: 'text-lg sm:text-xl', sub: 'text-[10px]', tag: 'text-xs' },
    lg: { img: 'h-14 sm:h-16 w-auto', text: 'text-2xl', sub: 'text-xs', tag: 'text-sm' },
    xl: { img: 'h-20 sm:h-24 w-auto', text: 'text-3xl', sub: 'text-sm', tag: 'text-base' },
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Javenly Innovations Logo Asset (Interlocking Blue & Red Links) */}
      <img
        src="/assets/aistudio/Gemini_Generated_Image_5xfn6o5xfn6o5xfn-removebg-preview__1__46f6d8c3.png"
        alt="Javenly Innovations Logo"
        className={`${currentSize.img} object-contain select-none drop-shadow-sm`}
      />

      {/* Javenly Innovations Wordmark */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className={`font-black ${currentSize.text} tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
              JAVENLY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
              IDENTITY
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`font-bold uppercase tracking-[0.2em] text-[#ED3833] ${currentSize.sub}`}>
              INNOVATIONS
            </span>
            {showTagline && (
              <>
                <span className="text-slate-400 text-xs">•</span>
                <span className={`font-medium italic ${currentSize.tag} ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Innovation with Impact
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
