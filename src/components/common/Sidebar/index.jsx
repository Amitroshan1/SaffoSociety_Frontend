export default function Sidebar({ children, ...props }) {
  return (
    <div className="sidebar" {...props}>
      {children}
    </div>
  );
}
