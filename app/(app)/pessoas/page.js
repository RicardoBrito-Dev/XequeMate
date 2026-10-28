import Link from 'next/link';
import PageTop from '@/components/page-top';
import Avatar from '@/components/avatar';
import InviteForm from './invite-form';
import { requireProfile, ROLE_LABEL } from '@/lib/auth';
import { updateAccess } from '@/lib/actions/pessoas';

export const metadata = { title: 'Pessoas' };

export default async function PessoasPage() {
  const { supabase, profile } = await requireProfile(['admin', 'staff']);
  const admin = profile.role === 'admin';

  const { data } = await supabase.from('profiles').select('*').order('created_at');
  const people = data || [];
  const team = people.filter((p) => p.role !== 'artist');
  const artists = people.filter((p) => p.role === 'artist');

  return (
    <>
      <PageTop title="Pessoas" subtitle={`${artists.filter((a) => a.active).length} artistas e ${team.filter((t) => t.active).length} pessoas na equipe`} />

      {admin ? <InviteForm /> : null}

      <section className="stack">
        <h2 className="h-sec">Artistas</h2>
        {artists.length ? (
          <div className="artist-grid">
            {artists.map((a) => (
              <Link key={a.id} href={`/pessoas/${a.id}`} className={`acard ${a.active ? '' : 'off'}`} style={{ '--c': a.color }}>
                <div className="bn" />
                <Avatar p={a} />
                <div className="bd">
                  <h3>{a.stage_name || a.name}</h3>
                  <span className="muted small">
                    {a.name}
                    {a.city ? ` · ${a.city}` : ''}
                  </span>
                  {a.genres?.length ? (
                    <div className="chips">
                      {a.genres.map((g) => (
                        <span key={g} className="chip">
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {!a.active ? <span className="pill bad">Desativado</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="empty">Nenhum artista ainda. {admin ? 'Use o formulário acima para convidar o primeiro.' : ''}</p>
          </div>
        )}
      </section>

      <section className="stack">
        <h2 className="h-sec">{admin ? 'Equipe e acessos' : 'Equipe'}</h2>
        <div className="card">
          <div className="list">
            {(admin ? people : team).map((p) => (
              <div key={p.id} className={`row wrap ${p.active ? '' : 'off'}`}>
                <Avatar p={p} size="sm" />
                <div className="grow">
                  <b>{p.role === 'artist' ? p.stage_name || p.name : p.name}</b>
                  <span>
                    {p.role === 'artist' ? 'Artista' : p.title || ROLE_LABEL[p.role]}
                    {admin && p.email ? ` · ${p.email}` : ''}
                  </span>
                </div>
                {admin && p.id !== profile.id ? (
                  <form action={updateAccess} className="inline-form">
                    <input type="hidden" name="id" value={p.id} />
                    <select name="role" defaultValue={p.role} aria-label={`Tipo de acesso de ${p.name}`}>
                      <option value="artist">Artista</option>
                      <option value="staff">Equipe</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select name="active" defaultValue={String(p.active)} aria-label={`Situação de ${p.name}`}>
                      <option value="true">Ativo</option>
                      <option value="false">Desativado</option>
                    </select>
                    <button className="btn sm">Salvar</button>
                  </form>
                ) : (
                  <span className="pill info">{p.id === profile.id ? 'Você' : ROLE_LABEL[p.role]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {admin ? <p className="hint">Desativar bloqueia o acesso na hora, sem apagar o histórico da pessoa.</p> : null}
      </section>
    </>
  );
}
