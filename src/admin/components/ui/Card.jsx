export function Card({ className='', children, ...props }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`} {...props}>{children}</div>;
}
export function CardHeader({ className='', children }) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}
export function CardTitle({ className='', children }) {
  return <h3 className={`text-sm font-semibold text-gray-700 tracking-wide uppercase ${className}`}>{children}</h3>;
}
export function CardContent({ className='', children }) {
  return <div className={`px-5 pb-5 space-y-4 ${className}`}>{children}</div>;
}
