# Orientações para agentes

- Projeto React 19 + Vite, React Router, Tailwind CSS 4 e CSS global. Textos em português brasileiro.
- Consulte DESIGN.md antes de alterar interfaces. Preserve a estética e os fluxos existentes.
- Rotas em src/main.jsx; telas em src/; persistência em src/data/; cliente Supabase em src/lib/supabase.js.
- Use componentes funcionais e ícones lucide-react. Evite novas dependências sem necessidade.
- Dados compartilhados devem ser persistidos no Supabase, nunca apenas no localStorage. Preserve registros existentes.
- Links do relacionamento usam o registro relationship-links em planning_config; a call mantém seu próprio registro.
- Valide URLs HTTP/HTTPS e use noopener noreferrer em links externos. Inclua estados de carregamento, vazio, erro e sucesso.
- A autenticação atual é demonstrativa: flags locais não são autorização segura. As políticas existentes permitem escrita pública. Não descreva esse mecanismo como proteção real; uma migração para autenticação e RLS por papel é necessária antes de guardar conteúdo sensível.
- Não exponha segredos nem adicione chaves privilegiadas ao frontend.
- Execute npm run build após mudanças. Faça verificações proporcionais e reporte limitações. Não publique sem solicitação.
