export default function PageHeader({ children, ...props }) {
  return (
    <div className="pageheader" {...props}>
      {children}
    </div>
  );
}
