import Button from './Button';

export default function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {actions && (
          <div className="px-5 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
