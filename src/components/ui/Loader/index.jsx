export default function Loader({ children, ...props }) {
  return (
    <div className="loader" {...props}>
      {children}
    </div>
  );
}
