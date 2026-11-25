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
A página inicial oferece duas ações: “Ver a próxima call” preenchida em rosa e “Nós dois” com contorno (abre os links e, para o admin, a lista de desejos). Em telas estreitas, empilhe os botões. Preserve as saudações existentes.

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

## Linguagem
O casal é ele (admin) e ela (Rebeca): use “nós dois”, “juntos”; para ela, ideias dele aparecem como “ideia dele”.
Use português simples e natural. Evite slogans decorativos como “feito com carinho”, “cada detalhe” e “um cantinho especial”. Remova frases que não acrescentam informação. No editor, prefira instruções diretas; nas mensagens pessoais, mantenha um tom de conversa, sem linguagem publicitária. Preserve textos personalizados salvos pelo usuário.

## Call não planejada
Em “O encontro”, o controle “Call planejada” define se o widget exibe o encontro ou um aviso de que não há call no momento. Desativar preserva os detalhes e permite salvar sem preencher a data. A prévia e a página real devem mostrar o mesmo estado. Configurações antigas continuam ativas por padrão.

## Modo de teste
O botão “Testar como usuário comum” no editor ativa uma simulação nesta aba, mantida ao recarregar. Use o papel efetivo de src/lib/access.js em todas as telas: esconder edição de links, impedir acesso ao editor e navegar para a call como visitante autenticado. Uma barra permite encerrar o teste e voltar ao admin. O teste usa dados salvos; alterações pendentes são guardadas como rascunho antes de sair. Logout encerra a sessão e o teste. Isso é uma ferramenta de interface, não substitui autorização no servidor.

## Editor de call
- Blocos livres sobre uma grade de 12 colunas; em telas estreitas todos ocupam a largura toda.
- Molduras, texturas e formas são CSS puro e usam a cor de destaque da página; mantenha as molduras antigas (chaves em `src/data/visuals.js`) para não quebrar chamadas salvas.
- O editor segue a paleta do site (rosa antigo e creme); o visual de cada call é livre e fica por conta do conteúdo.

## Caderno de sonhos
Segunda escolha da página “Nós dois” (`/links?aba=lista`, só admin por enquanto; a escolha “Links | Caderno de sonhos” fica no cabeçalho), na identidade do site: creme, rosa antigo, Georgia nas ideias e sistema nos controles.
É uma bucket list num caderno de verdade, com altura fixa: quando não cabe mais nada, o conteúdo continua na próxima página (o caderno nunca cresce). No computador são duas páginas abertas; no celular, uma por vez.
- Ordem das páginas: "Algum dia…" (ideias, mais novas primeiro; a 1ª página tem o título, o filtro "Tudo ▾" e o "Eu quero…") e depois um ano por vez, do mais recente ao mais antigo (a 1ª página do ano tem o número grande e a régua dos meses). Continuações dizem "continuação". Se sobrar uma página ímpar, ela fica em branco ("continua…").
- Virar: puxe a página com o dedo/mouse (no computador a folha acompanha o ponteiro e vira se passar da metade ou num peteleco; se não, volta; no celular a página desliza e a de baixo aparece). Também: tocar no canto dobrado, setas do teclado ou as abas de divisória (Algum dia, 2026, 2025…) na lateral (no celular, em cima).
- Papel e caneta: dentro do caderno nada parece site. Ideias, lembranças, datas e números são escritos à mão (Caveat, servida pelo próprio site em public/fonts) em cor de tinta, sobre papel pautado; bolinha e visto desenhados; riscado à mão; botões com borda desenhada. Nada é selecionável (exceto campos de texto) e as fotos não abrem em outra aba: tocar na polaroid a pega na mão, grande, com a legenda escrita.
- Linhas com tamanho previsível: título até 2 linhas, detalhe 1 linha, frase da lembrança até 2 (o texto completo aparece ao editar). Se algo ainda não couber (um formulário aberto), rola dentro da página.
- Barra acima do caderno: "X de Y riscadas", avisos, "Sortear uma" e "Adesivos". O sorteio aparece como um bilhete preso com fita sobre o caderno.
- Marcar a bolinha abre "Fizemos" na própria linha (data editável, como foi, fotos). Ao guardar, o caderno vira até a página do ano e a lembrança aparece em destaque.
- Capa: o caderno começa fechado (capa rosa antigo, etiqueta, elástico). "Abrir o caderno" vira a capa e mostra a folha de guarda; não volta na mesma sessão do navegador.
- Adesivos (papelaria, desenhos próprios, sem emoji: selos, lacre de cera, flor prensada, bilhete, polaroid, ingresso, etiqueta, coração, estrela…): a cartela sobe de baixo; puxe um adesivo e ele segue o dedo com leve atraso, inclinando conforme o movimento; solto numa página ele é "pressionado" no papel; fora da página volta para a cartela. Arraste para mover (ele levanta). Toque para selecionar: a alça do canto gira e muda o tamanho num gesto só; o × descola. Ficam no Supabase (`bucket_stickers`: página, posição em %, giro, tamanho).
- Detalhes de caderno, sempre discretos: textura de papel, espessura das folhas, costura na lombada, fitinha marcadora, linha de margem rosa, fita adesiva nas polaroids, números de página, canto dobrado.
- Categorias: Sonhos, Bobeiras, Comidas, Viagens, Românticos, Aventuras (as chaves no banco não mudam).
- Sem selos, emojis, confete ou barras de progresso.

## Movimento
- Tokens em `src/styles/motion.css`: curva `--ease-out`, entradas em cascata (`.stagger`), troca de página com View Transitions (navegadores sem suporte trocam direto), escolha entre seções com pílula deslizante, feedback de toque.
- `prefers-reduced-motion` desliga animações e transições.

## Cursores compartilhados
Quem está logado (fora do modo de teste) vê o cursor das outras pessoas na mesma página, com nome e cor escolhidos no botão do canto inferior esquerdo. No celular aparece o ponto do toque. Usa Supabase Realtime (broadcast, sem tabela e sem guardar nada); se o Realtime estiver indisponível, o site funciona normalmente sem cursores.
