# Modelos de e-mail do Supabase

Onde trocar: **Supabase › Authentication › Emails › Templates**.

Em cada modelo, troque o **Subject** e o **Body** pelo texto abaixo e clique em **Save**.

O link precisa ser exatamente esse. É ele que leva a pessoa de volta ao app já logada.

---

## Invite user (convite)

**Subject:** Seu acesso ao Xeque Mate Studio

```html
<h2>Você foi convidado para o Xeque Mate Studio</h2>
<p>Clique no botão abaixo para criar a sua senha e entrar no app do estúdio.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Criar minha senha</a></p>
<p>Se você não esperava este convite, pode ignorar este e-mail.</p>
```

---

## Magic Link (link de acesso)

**Subject:** Seu link para entrar no Xeque Mate

```html
<h2>Entrar no Xeque Mate Studio</h2>
<p>Clique no botão abaixo para entrar. O link vale por 1 hora e só funciona uma vez.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Entrar no app</a></p>
<p>Se não foi você que pediu, pode ignorar este e-mail.</p>
```

---

## Reset Password (nova senha)

**Subject:** Criar uma nova senha no Xeque Mate

```html
<h2>Nova senha</h2>
<p>Clique no botão abaixo para criar uma senha nova para o app do Xeque Mate Studio.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Criar nova senha</a></p>
<p>Se não foi você que pediu, pode ignorar este e-mail. A sua senha continua a mesma.</p>
```
