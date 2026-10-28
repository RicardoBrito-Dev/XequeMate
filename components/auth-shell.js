export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth-in">
        <div className="logo-big">
          <span className="king" aria-hidden="true">♚</span>
          <div>
            <h1>
              Xeque <em>Mate</em>
            </h1>
            <p>Estúdio de gravação · mixagem · master</p>
          </div>
        </div>
        <div className="card auth-card">
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p className="muted auth-sub">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
