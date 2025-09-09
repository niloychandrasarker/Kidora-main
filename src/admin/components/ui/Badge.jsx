export default function Badge({ children, variant='default', className='' }) {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-700',
    danger: 'bg-red-100 text-red-700'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant] || styles.default} ${className}`}>{children}</span>;
}
