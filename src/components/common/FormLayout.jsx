import '../../styles/common/crud.css';

export default function FormLayout({ sections, children, footer }) {
  return (
    <div className="crud-form-layout">
      {sections?.map((section) => (
        <section key={section.title} className="crud-form-section">
          <h3 className="crud-form-section-title">{section.title}</h3>
          <div className="crud-form-grid">{section.content}</div>
        </section>
      ))}
      {children}
      {footer}
    </div>
  );
}
