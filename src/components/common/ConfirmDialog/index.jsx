export default function ConfirmDialog({ children, ...props }) {
  return (
    <div className="confirmdialog" {...props}>
      {children}
    </div>
  );
}
