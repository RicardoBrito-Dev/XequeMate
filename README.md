# Xeque Mate · app do estúdio

App do Xeque Mate Studio feito em Next.js + Supabase, pronto para GitHub e Vercel.

## O que já funciona (etapa 1)

- **Login** com e-mail e senha, link de acesso por e-mail, "esqueci a senha" e troca de senha.
- **Três tipos de acesso**:
  - **Admin:** vê e gerencia tudo.
  - **Equipe** (técnico ou produtor): agenda completa e lista de pessoas.
  - **Artista:** só as próprias sessões. Na agenda, os horários dos outros aparecem como "Reservado".
- **As regras de acesso ficam no banco de dados**, não só nas telas. Mesmo que alguém mexa no site, não consegue ver dados de outro artista, mudar preço, marcar por cima de outra sessão nem virar admin.
- **Convites:** o admin cadastra artistas e equipe por convite no e-mail ou com uma senha provisória para mandar pelo WhatsApp. O admin também pode desativar uma conta.
- **Agenda do estúdio:**
  - semana com o horário de funcionamento;
  - o artista pede o horário e a equipe aprova ou recusa;
  - técnico responsável em cada sessão;
  - preço calculado sozinho pelo serviço;
  - bloqueio de conflito de horário.
- **Painel** de cada tipo de acesso.
- **Perfil** com foto, bio, gêneros, redes e cor.
- **Ajustes:** horário do estúdio e preço por hora de cada serviço.
- **Instalação no celular:** o app pode ir para a tela inicial, como um aplicativo.

As outras partes do protótipo (agenda dos artistas, EPs, arquivos, financeiro e Pix, pacotes, documentos e relatórios) entram nas próximas etapas, uma de cada vez, em cima deste mesmo projeto.

---

## Passo a passo para colocar no ar

Faça na ordem. Leva uns 30 minutos.

### 1. Supabase: criar o banco

1. Entre em [supabase.com](https://supabase.com) e clique em **New project**.
   - **Region:** South America (São Paulo).
   - Anote a senha do banco num lugar seguro.
2. Quando o projeto terminar de criar, vá em **SQL Editor › New query**.
3. Abra o arquivo `supabase/migrations/0001_login_perfis_agenda.sql` deste projeto, copie **tudo**, cole no editor e clique em **Run**.
   - Deve aparecer *Success. No rows returned*.
   - Rode **uma vez só**.
4. Vá em **Authentication › Sign In / Providers** e **desligue** a opção **Allow new users to sign up**. Assim só entra quem você convidar. Deixe o provedor **Email** ligado.
5. Vá em **Project Settings › API Keys** (em alguns projetos: **Settings › API**) e anote:
   - **Project URL** (fica em Settings › Data API ou no topo da página de API);
   - a chave pública: **anon public** ou **Publishable key**;
   - a chave secreta: **service_role** ou **Secret key**. Essa nunca vai para o GitHub.

### 2. GitHub: subir o código

1. Crie um repositório **privado**, por exemplo `xeque-mate`.
2. Envie os arquivos desta pasta:
   - Pelo site do GitHub: **Add file › Upload files** e arraste o conteúdo da pasta.
   - Ou pelo GitHub Desktop.
3. Não envie nenhum arquivo `.env` com chaves. O `.gitignore` já protege isso.

### 3. Vercel: publicar o site

1. Em [vercel.com](https://vercel.com), clique em **Add New › Project** e importe o repositório.
2. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave pública (anon ou publishable) |
   | `SUPABASE_SERVICE_ROLE_KEY` | a chave secreta (service_role ou secret) |
   | `NEXT_PUBLIC_SITE_URL` | deixe para o passo 4 |

   Se você ligou a **integração do Supabase na Vercel**, ela já cria `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`. O app aceita esses nomes também, então não precisa criar as três primeiras.

3. Clique em **Deploy**. No fim, a Vercel mostra o endereço do site, algo como `https://xeque-mate.vercel.app`.
4. Volte em **Settings › Environment Variables**:
   - cadastre `NEXT_PUBLIC_SITE_URL` com esse endereço, sem barra no final;
   - depois vá em **Deployments**, clique em **⋯** no último deploy e escolha **Redeploy**.

### 4. Supabase: ligar o site aos e-mails

1. Em **Authentication › URL Configuration**:
   - **Site URL:** o endereço da Vercel (ex.: `https://xeque-mate.vercel.app`).
   - **Redirect URLs:** adicione `https://xeque-mate.vercel.app/**` e `http://localhost:3000/**`.
2. Em **Authentication › Emails › Templates**, troque o link de três modelos. Os textos prontos estão em [`supabase/modelos-de-email.md`](supabase/modelos-de-email.md):
   - **Invite user** (convite)
   - **Magic Link** (link de acesso)
   - **Reset Password** (nova senha)

### 5. Criar a sua conta de admin

1. No Supabase, vá em **Authentication › Users › Add user › Create new user**.
2. Coloque o seu e-mail e uma senha, marque **Auto Confirm User** e crie.
3. **O primeiro usuário criado vira admin automaticamente.**
4. Abra o site da Vercel e entre com esse e-mail e essa senha.

Se por algum motivo você não aparecer como admin, rode isto no SQL Editor, trocando pelo seu e-mail:

```sql
update public.profiles set role = 'admin', active = true where email = 'seu@email.com';
```

### 6. Começar a usar

1. Em **Ajustes**, confira o horário do estúdio e os preços.
2. Em **Pessoas**, convide a equipe e os artistas.
3. Em **Meu perfil**, coloque a sua foto.

---

## E-mails no plano grátis (importante)

O e-mail que vem com o Supabase grátis é só para testes:

- envia poucas mensagens por hora;
- pode só entregar para e-mails da sua própria conta Supabase.

Por isso, enquanto não configurar outro serviço:

- **Use a opção "Senha provisória"** ao convidar. O app mostra uma mensagem pronta com o link e a senha para você mandar pelo WhatsApp. A pessoa entra e troca a senha em Meu perfil.
- Ou configure um SMTP em **Project Settings › Authentication › SMTP Settings**:
  - **Sem domínio próprio:** dá para usar o Gmail do estúdio com uma "senha de app" (Conta Google › Segurança › Senhas de app). Host `smtp.gmail.com`, porta `465`.
  - **Quando tiver domínio:** o [Resend](https://resend.com) tem plano grátis e é o mais indicado.

## Outros avisos

- **O Supabase grátis pausa o projeto depois de 7 dias sem uso.** É só entrar no painel do Supabase e clicar em *Restore*. Com o estúdio usando o app todo dia, isso não acontece.
- **A chave secreta** (`SUPABASE_SERVICE_ROLE_KEY`) ignora as regras de acesso. Ela só existe na Vercel, nunca no código nem no navegador.
- **Os modelos de contrato e o Pix** entram nas próximas etapas.

## Rodar no seu computador (opcional)

Precisa do [Node.js](https://nodejs.org) 18.18 ou mais novo.

```bash
npm install
cp .env.example .env.local   # e preencha as chaves
npm run dev                  # abre em http://localhost:3000
```

## Estrutura

```
app/                 telas (login, painel, agenda, pessoas, perfil, ajustes)
components/          peças reaproveitadas (menu, janela, avatar, perfil)
lib/actions/         ações que salvam no banco (agenda, pessoas, perfil, login)
lib/supabase/        conexão com o Supabase
middleware.js        exige login em todas as páginas internas
supabase/migrations/ banco de dados e regras de acesso
```
