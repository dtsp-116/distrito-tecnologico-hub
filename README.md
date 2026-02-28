# Distrito Tecnologico - Hub Inteligente de Editais

Frontend em `Next.js + React + TypeScript + TailwindCSS` com backend no App Router e persistencia no Supabase.

## Como executar

```bash
npm install
npm run dev
```

## Ativar IA no chat (Groq)

1. Crie o arquivo `.env.local` na raiz do projeto.
2. Adicione a chave:

```bash
GROQ_API_KEY=sua_chave_groq
```

3. Reinicie o servidor `npm run dev`.
4. Abra o chat geral ou de edital e envie uma mensagem.

## Supabase (auth + banco + storage)

1. Copie `.env.example` para `.env.local`.
2. Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. No SQL Editor do Supabase, execute o migration:
   - `supabase/migrations/202602281450_initial_schema.sql`
4. Crie o primeiro usuario admin:
   - Cadastre um usuario pelo Auth do Supabase
   - No SQL Editor, rode:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DO_USUARIO';
```

5. Reinicie o projeto (`npm run dev`).

### Fluxo de login

- `user`: acesso ao hub e detalhes de editais/agencias.
- `admin`: acesso ao painel `/admin` para CRUD de agencias/editais/tags e upload de arquivos.
- Rotas protegidas por middleware com verificacao de sessao e role.

## Estrutura

```text
/src
├── app
├── components
├── features
├── hooks
├── layouts
├── mocks
├── types
└── styles
```

## Decisoes arquiteturais

- **Separacao por camadas**: `features` orquestra tela, `components` mantem blocos reutilizaveis, `hooks` concentra regras de estado.
- **Dados mockados locais**: `src/mocks/editais.ts` simula fonte externa para facilitar futura troca por API.
- **Tipagem forte**: interfaces de dominio centralizadas em `src/types`.
- **Responsividade mobile-first**: sidebar vira drawer no mobile, chat geral vira botao flutuante/modal.
