export default function Select({ children, ...props }) {
  return (
    <div className="select" {...props}>
      {children}
    </div>
  );
}
