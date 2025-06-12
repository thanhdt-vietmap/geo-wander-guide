import React from 'react';

interface AmericanFlagProps {
  className?: string;
}

const AmericanFlag: React.FC<AmericanFlagProps> = ({ className = "w-4 h-3" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red stripes */}
      <rect width="24" height="18" fill="#B22234" />
      
      {/* White stripes */}
      <rect y="1.4" width="24" height="1.4" fill="white" />
      <rect y="4.2" width="24" height="1.4" fill="white" />
      <rect y="7" width="24" height="1.4" fill="white" />
      <rect y="9.8" width="24" height="1.4" fill="white" />
      <rect y="12.6" width="24" height="1.4" fill="white" />
      <rect y="15.4" width="24" height="1.4" fill="white" />
      
      {/* Blue canton */}
      <rect width="9.6" height="9.8" fill="#3C3B6E" />
      
      {/* Simplified stars */}
      <circle cx="2.4" cy="2" r="0.4" fill="white" />
      <circle cx="4.8" cy="2" r="0.4" fill="white" />
      <circle cx="7.2" cy="2" r="0.4" fill="white" />
      <circle cx="3.6" cy="3.2" r="0.4" fill="white" />
      <circle cx="6" cy="3.2" r="0.4" fill="white" />
      <circle cx="2.4" cy="4.4" r="0.4" fill="white" />
      <circle cx="4.8" cy="4.4" r="0.4" fill="white" />
      <circle cx="7.2" cy="4.4" r="0.4" fill="white" />
      <circle cx="3.6" cy="5.6" r="0.4" fill="white" />
      <circle cx="6" cy="5.6" r="0.4" fill="white" />
      <circle cx="2.4" cy="6.8" r="0.4" fill="white" />
      <circle cx="4.8" cy="6.8" r="0.4" fill="white" />
      <circle cx="7.2" cy="6.8" r="0.4" fill="white" />
      <circle cx="3.6" cy="8" r="0.4" fill="white" />
      <circle cx="6" cy="8" r="0.4" fill="white" />
    </svg>
  );
};

export default AmericanFlag;
