export default function EmptyState({ children, ...props }) {
  return (
    <div className="emptystate" {...props}>
      {children}
    </div>
  );
}
