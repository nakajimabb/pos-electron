import React from 'react';

const Loader: React.FC = () => {
  return (
    <div style={{ position: 'fixed', width: '100%', height: '100%', left: 0, top: 0, zIndex: 99999 }}>
      <div
        className="loading-indicator"
        style={{
          position: 'fixed',
          width: 60,
          height: 60,
          left: 'calc(50% - 60px/2)',
          top: 'calc(50% - 60px/2)',
        }}
      ></div>
    </div>
  );
};

export default Loader;
