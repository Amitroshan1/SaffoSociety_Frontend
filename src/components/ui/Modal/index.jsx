export default function Modal({ children, ...props }) {
  return (
    <div className="modal" {...props}>
      {children}
    </div>
  );
}
