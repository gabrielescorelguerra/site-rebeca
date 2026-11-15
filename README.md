# Site da Rebeca

Um cantinho para os convites de ligação. React 19 + Vite, React Router, Tailwind CSS 4 e Supabase.

## Rodando

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Outros comandos: `npm run build`, `npm run lint` e `npm test` (testes das regras puras: migração de blocos, calendário, links, texturas).

## Supabase

Rode `supabase-schema.sql` no SQL Editor. Ele cria a tabela `planning_config` (registros `main` para a call e `relationship-links` para os links) e o bucket público `call-media`, usado pelo upload de imagens do editor.

> A autenticação atual é só demonstrativa e as políticas permitem escrita pública. Antes de guardar algo sensível é preciso migrar para Supabase Auth com RLS por papel.

## Editor de call (`/admin`)

O convite é uma lista de **blocos** numa grade de 12 colunas (`planning.blocks`):

- **Biblioteca** (esquerda): arraste um bloco para o palco ou clique para adicionar; aba *Camadas* para reordenar; aba *Modelos* com layouts prontos.
- **Palco** (centro): clique para selecionar, arraste a alça para mover, arraste a borda direita para mudar a largura. Desfazer/refazer com `Ctrl+Z` / `Ctrl+Shift+Z`, `Ctrl+S` publica, `Alt+setas` move com o teclado.
- **Propriedades** (direita): conteúdo, estilo (moldura, forma, fonte, cor, posição, inclinação) e movimento de cada bloco; sem seleção, ajustes da página (encontro, tema, fundo, moldura e animações).

Registros antigos (campos soltos como `showActivities`, `activities`…) são convertidos em blocos automaticamente ao abrir; os campos antigos continuam no registro. Publicar compara a versão carregada (`updated_at`) e avisa se a call foi alterada em outro lugar.
