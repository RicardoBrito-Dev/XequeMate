export default function PageTop({ title, subtitle, children }) {
  return (
    <header className="top">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? <div className="top-actions">{children}</div> : null}
    </header>
  );
}
