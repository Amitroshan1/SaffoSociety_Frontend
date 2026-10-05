export default function Header({ children, ...props }) {
  return (
    <div className="header" {...props}>
      {children}
    </div>
  );
}
