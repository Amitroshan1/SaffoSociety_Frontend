export default function Button({ children, ...props }) {
  return (
    <div className="button" {...props}>
      {children}
    </div>
  );
}
