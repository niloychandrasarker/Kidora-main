import React from 'react';
export default function Button({ as: Tag = 'button', variant = 'default', className = '', children, ...props }) {
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border border-gray-300 hover:border-gray-400 text-gray-700 bg-white',
    ghost: 'text-gray-600 hover:bg-gray-100',
    destructive: 'bg-red-600 hover:bg-red-700 text-white'
  };
  return React.createElement(
    Tag,
    {
      className: `inline-flex items-center justify-center gap-2 font-medium text-sm rounded-md px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant] || variants.default} ${className}`,
      ...props
    },
    children
  );
}
