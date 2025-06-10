import React from 'react';

const FontTest: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Font Test - Nunito Sans</h1>
      <p className="text-base">This is regular text with Nunito Sans font family.</p>
      <p className="text-sm font-medium">This is medium weight text.</p>
      <p className="text-lg font-semibold">This is semibold text.</p>
      <input 
        type="text" 
        placeholder="Input field with Nunito Sans" 
        className="border p-2 rounded"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded font-medium">
        Button with Nunito Sans
      </button>
      <div style={{ fontFamily: 'serif' }}>
        This text uses serif to test font inheritance override
      </div>
      <div className="font-mono">
        This text uses monospace font class
      </div>
    </div>
  );
};

export default FontTest;
