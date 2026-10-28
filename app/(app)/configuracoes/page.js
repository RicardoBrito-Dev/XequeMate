import PageTop from '@/components/page-top';
import { requireProfile } from '@/lib/auth';
import { saveService, saveSettings } from '@/lib/actions/config';
import { pad } from '@/lib/dates';

export const metadata = { title: 'Ajustes' };

export default async function ConfigPage() {
  const { supabase } = await requireProfile(['admin']);
  const [{ data: cfg }, { data: services }] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('services').select('*').order('sort').order('name'),
  ]);
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <>
      <PageTop title="Ajustes do estúdio" subtitle="Horário de funcionamento e preço por hora de cada serviço" />

      <form action={saveSettings} className="card form">
        <h2 className="h-card full">Estúdio</h2>
        <div className="field full">
          <label htmlFor="st-name">Nome do estúdio</label>
          <input id="st-name" name="studio_name" defaultValue={cfg?.studio_name || 'Xeque Mate Studio'} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="st-open">Abre às</label>
          <select id="st-open" name="open_hour" defaultValue={String(cfg?.open_hour ?? 9)}>
            {hours.slice(0, 24).map((h) => (
              <option key={h} value={h}>
                {pad(h)}:00
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="st-close">Fecha às</label>
          <select id="st-close" name="close_hour" defaultValue={String(cfg?.close_hour ?? 23)}>
            {hours.slice(1).map((h) => (
              <option key={h} value={h}>
                {pad(h)}:00
              </option>
            ))}
          </select>
        </div>
        <div className="mact full">
          <button className="btn pri">Salvar horário</button>
        </div>
      </form>

      <section className="card stack">
        <div className="card-h">
          <h2>Serviços e preço por hora</h2>
        </div>
        <p className="muted small">O preço da sessão é calculado pelo banco com estes valores. Mudar o preço não altera sessões que já foram marcadas.</p>
        <div className="svc-list">
          {(services || []).map((s) => (
            <form key={s.id} action={saveService} className="svc-row">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} aria-label="Nome do serviço" maxLength={40} required />
              <div className="money">
                <span>R$</span>
                <input name="price" type="number" min="0" step="1" defaultValue={Number(s.price_per_hour)} aria-label={`Preço por hora de ${s.name}`} required />
                <span>/h</span>
              </div>
              <select name="active" defaultValue={String(s.active)} aria-label={`Situação de ${s.name}`}>
                <option value="true">Ativo</option>
                <option value="false">Pausado</option>
              </select>
              <button className="btn sm">Salvar</button>
            </form>
          ))}
          <form action={saveService} className="svc-row new">
            <input name="name" placeholder="Novo serviço" aria-label="Nome do novo serviço" maxLength={40} required />
            <div className="money">
              <span>R$</span>
              <input name="price" type="number" min="0" step="1" placeholder="0" aria-label="Preço por hora do novo serviço" required />
              <span>/h</span>
            </div>
            <input type="hidden" name="active" value="true" />
            <span />
            <button className="btn sm pri">Adicionar</button>
          </form>
        </div>
      </section>
    </>
  );
}
