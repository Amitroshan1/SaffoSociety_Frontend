export default function Table({ children, ...props }) {
  return (
    <div className="table" {...props}>
      {children}
    </div>
  );
}
