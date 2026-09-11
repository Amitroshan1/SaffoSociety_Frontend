export function PageHeader({ icon: Icon, iconColor, title, subtitle, action }) {
  return (
    <div className="page-header resident-page-chrome">
      <div className="page-header-row">
        <div className="page-header-title-wrap">
          {Icon ? (
            <span className="page-header-icon" style={iconColor ? { color: iconColor } : undefined}>
              <Icon size={20} />
            </span>
          ) : null}
          <h1 className="page-header-title resident-page-title">{title}</h1>
        </div>
        {action}
      </div>
      {subtitle ? <p className="page-header-sub resident-page-subtitle">{subtitle}</p> : null}
    </div>
  );
}
