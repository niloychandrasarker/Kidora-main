export default function Textarea({ className='', rows=4, ...props }) {
  return <textarea rows={rows} className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-y ${className}`} {...props} />;
}
