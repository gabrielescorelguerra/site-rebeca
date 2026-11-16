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
- **Palco** (centro): clique para selecionar; clique de novo no texto para digitar ali mesmo. Arraste o bloco para posicioná-lo livremente (Alt desliga o ímã no zero), a alça superior troca a ordem, a borda direita muda a largura, a de baixo a altura e o círculo gira. Uma barra flutuante junto ao bloco traz tamanho, negrito, itálico, cor, alinhamento, moldura, formato e largura. Setas deslocam o bloco, `Alt+setas` reordenam, `Enter` edita o texto; `Ctrl+Z`/`Ctrl+Shift+Z` desfazem/refazem e `Ctrl+S` publica. O tamanho do texto vale em px exatos, igual no editor e na página final (só telas estreitas diminuem).
- **Propriedades** (direita): conteúdo, estilo (moldura, forma, fonte, cor, posição, inclinação) e movimento de cada bloco; sem seleção, ajustes da página (encontro, tema, fundo, moldura e animações).

**Elementos interativos** (grupo “Interativos” na biblioteca): confirmação de presença, votação, pergunta com texto, checklist, quiz, segredo (abre ao tocar, numa data ou com senha) e surpresa (chuva de corações). As respostas dela ficam na tabela `call_responses` (uma por bloco e por call) e aparecem no painel “Resposta dela” ao selecionar o bloco. Quando você visita `/planejamento` como admin ou no modo de teste, as respostas **não** são gravadas. A senha do bloco “Segredo” é só brincadeira: fica no código da página.

Registros antigos (campos soltos como `showActivities`, `activities`…) são convertidos em blocos automaticamente ao abrir; os campos antigos continuam no registro. Publicar compara a versão carregada (`updated_at`) e avisa se a call foi alterada em outro lugar.
