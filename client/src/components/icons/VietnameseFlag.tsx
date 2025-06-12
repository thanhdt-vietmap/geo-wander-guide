import React from 'react';

interface VietnameseFlagProps {
  className?: string;
}

const VietnameseFlag: React.FC<VietnameseFlagProps> = ({ className = "w-4 h-3" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="18" fill="#DA251D" />
      <polygon
        points="12,4 13.176,8.172 17.348,8.172 14.086,10.656 15.262,14.828 12,12.344 8.738,14.828 9.914,10.656 6.652,8.172 10.824,8.172"
        fill="#FFFF00"
      />
    </svg>
  );
};

export default VietnameseFlag;
