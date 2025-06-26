import React from 'react';

interface Base64IconProps {
  base64Data: string;
  alt: string;
  className?: string;
  size?: number;
}

export const Base64Icon: React.FC<Base64IconProps> = ({ 
  base64Data, 
  alt, 
  className = '', 
  size = 20 
}) => {
  return (
    <img
      src={base64Data}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
};

// 使用例のBase64データ（実際のデータに置き換えてください）
export const iconData = {
  dumbbell: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNSA2LjVIMTcuNVY3LjVINi41VjYuNVoiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTYuNSAxNi41SDE3LjVWMTcuNUg2LjVWMTYuNVoiIGZpbGw9IiMzMzMiLz4KPC9zdmc+',
  bicycle: 'data:image/svg+xml;base64,...',
  scale: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  notebook: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
};