// Aparece na hora ao trocar de aba, enquanto a página busca os dados
export default function Loading() {
  return (
    <div className="skel" aria-busy="true" aria-label="Carregando">
      <div className="skel-top">
        <span className="skel-bar w40" />
        <span className="skel-bar w25 thin" />
      </div>
      <div className="skel-card tall" />
      <div className="two">
        <div className="skel-card" />
        <div className="skel-card" />
      </div>
    </div>
  );
}
