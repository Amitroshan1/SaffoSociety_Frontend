export default function Badge({ children, ...props }) {
  return (
    <div className="badge" {...props}>
      {children}
    </div>
  );
}
