# Design do site

## Direção
Um espaço íntimo, romântico e tranquilo. Preserve o tom carinhoso, os espaços generosos, a flor delicada e os detalhes de coração. Evite cores saturadas e elementos visuais pesados.

## Paleta e tipografia
- Fundo: creme #fbf8f6; superfícies claras #fffaf9.
- Destaque: rosa antigo #bd7184; títulos e ações #965365.
- Texto principal: #31292d; secundário: #88777c; bordas: #e8dfe0.
- Títulos serifados (Georgia ou font-serif), peso normal, espaçamento levemente negativo.
- Texto e controles em Inter/system-ui; etiquetas pequenas em caixa alta, com espaçamento entre letras.

## Componentes e composição
A página inicial oferece duas ações: “Ver a próxima call” preenchida em rosa e “Nossos links” com contorno. Em telas estreitas, empilhe os botões. Preserve as saudações existentes.

A página de links tem título amplo, introdução curta e cartões arredondados: título, descrição opcional e indicação de abertura externa. Duas colunas no desktop e uma no celular. O administrador vê campos editáveis, adicionar/remover e salvar. Os visitantes veem os links publicados.

Reutilize site-shell, text-button, admin-input e os padrões do editor. Mudanças nos links não devem alterar o tema personalizado da call.

## Acessibilidade e movimento
Use rótulos visíveis, foco por teclado, nomes acessíveis para botões de ícone, feedback de erro e regiões de status. Indique nova aba. Mantenha animações discretas e respeite prefers-reduced-motion. Evite rolagem horizontal a partir de 320px.

## Editor e experiência da call
- Organize o editor por intenção: encontro, temas, experiência, aparência, fundo, movimento, atividades e links. Ajustes finos ficam recolhidos para reduzir a densidade inicial.
- Prévia em tela inteira usa o mesmo PlanningCanvas da página real; mantenha o rascunho no editor. “Ver versão salva” abre a rota real em nova aba sem perder a edição.
- O admin recebe um acesso de retorno ao editor na versão salva. Visitantes não veem essa barra.
- Durante a busca da configuração, use CallSplash, sem exibir conteúdo de exemplo ou impor atraso artificial. Falhas devem oferecer nova tentativa e retorno ao início.
- Personalizações opcionais: botão da ligação, calendário, bilhete, contagem em blocos, cor própria do título, visibilidade de conteúdo e composição das seções. Preserve compatibilidade de configurações antigas com defaultPlanning.
- No celular, mantenha a ação de salvar acessível e espaço inferior para não encobrir os campos. Prévia modal deve preservar foco, Escape e movimento reduzido.
