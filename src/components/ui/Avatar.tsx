import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className
}) => {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-base font-semibold',
    xl: 'h-20 w-20 text-xl font-bold'
  };

  const isDefaultImage = src?.includes('photo-1507003211169-0a1dd7228f2d');

  return (
    <div className={clsx('relative inline-block', className)}>
      {src && !isDefaultImage ? (
        <img
          src={src}
          alt={name}
          className={clsx('rounded-full object-cover border border-brand-border shadow-xs', sizes[size])}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full bg-orange-100 border border-orange-200 text-primary flex items-center justify-center font-semibold uppercase tracking-wider',
            sizes[size]
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};
