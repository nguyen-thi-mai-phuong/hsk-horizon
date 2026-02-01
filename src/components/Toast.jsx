// src/components/Toast.jsx
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 3000); // Tự động đóng sau 3 giây

    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-red-500';

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-fade-in-up`}
      role="alert"
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="text-white font-bold text-lg leading-none">
        &times;
      </button>
    </div>
  );
}
