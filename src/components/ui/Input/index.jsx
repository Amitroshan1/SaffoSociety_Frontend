export default function Input({ children, ...props }) {
  return (
    <div className="input" {...props}>
      {children}
    </div>
  );
}
