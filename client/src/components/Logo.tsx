
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <img
      src="/lovable-uploads/bda1bfc3-7681-48ab-8eed-7a3f7ea24c43.png"
      alt="VietMap Live Map Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
