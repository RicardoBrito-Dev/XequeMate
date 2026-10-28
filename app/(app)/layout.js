import Shell from '@/components/shell';
import { requireProfile } from '@/lib/auth';

export default async function AppLayout({ children }) {
  const { profile } = await requireProfile();
  const p = {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    stage_name: profile.stage_name,
    color: profile.color,
    avatar_url: profile.avatar_url,
  };
  return <Shell profile={p}>{children}</Shell>;
}
