export default function Footer({ children, ...props }) {
  return (
    <div className="footer" {...props}>
      {children}
    </div>
  );
}
