export default function Pagination({ children, ...props }) {
  return (
    <div className="pagination" {...props}>
      {children}
    </div>
  );
}
