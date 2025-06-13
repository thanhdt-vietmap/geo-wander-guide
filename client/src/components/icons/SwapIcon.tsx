import React from 'react';

interface SwapIconProps {
  className?: string;
  size?: number;
}

const SwapIcon: React.FC<SwapIconProps> = ({ className = "w-6 h-6", size = 24 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17 4V20M17 20L13 16M17 20L21 16M7 20V4M7 4L3 8M7 4L11 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SwapIcon;
