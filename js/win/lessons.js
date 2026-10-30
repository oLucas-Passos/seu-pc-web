// As 15 lições do curso de Windows. Cada passo é concluído quando o simulador avisa (evento) que a pessoa fez a ação.
import { SPECIAL } from './fs.js';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const win = app => `.w-window[data-app="${app}"]`;

// Prepara a área de trabalho limpa, já logada.
async function desk(os) {
  for (const w of [...os.windows]) await os.close(w, { force: true });
  os.closePanels();
  if (os.state !== 'desktop') os.skipToDesktop();
}

export const LESSONS = [
  {
    id: 'ligar', level: 'Básico', title: 'Ligando o computador', time: '2 min',
    desc: 'Ligar, desbloquear a tela e entrar no Windows.',
    intro: 'Todo computador começa desligado. Ao apertar o botão de ligar, ele carrega o Windows e mostra a tela de bloqueio, que protege seu computador quando você não está por perto.',
    setup: async (os) => { for (const w of [...os.windows]) await os.close(w, { force: true }); os.closePanels(); os.lockEl.hidden = true; os.state = 'off'; os.showBoot('off'); },
    steps: [
      { text: 'Clique no botão "Ligar o computador".', target: '[data-tut="poweron"]', on: 'power', when: d => d.state === 'boot' },
      { text: 'Aguarde o Windows carregar. Quando aparecer o relógio grande (tela de bloqueio), clique em qualquer lugar da tela.', hint: 'Também funciona apertando qualquer tecla.', on: 'power', when: d => d.state === 'unlocked' },
      { text: 'Clique em "Entrar".', hint: 'Num computador de verdade você digitaria sua senha ou PIN aqui.', target: '[data-tut="login"]', on: 'power', when: d => d.state === 'login' },
    ],
    outro: 'Pronto! Esta é a Área de Trabalho, a "mesa" do Windows. Embaixo fica a Barra de Tarefas, com o botão Iniciar e os programas.',
  },
  {
    id: 'mouse', level: 'Básico', title: 'Usando o mouse', time: '4 min',
    desc: 'Clique, clique duplo, botão direito e arrastar.',
    intro: 'O mouse tem dois botões principais. O esquerdo serve para escolher e abrir coisas; o direito abre um menu com opções. Vamos treinar os quatro movimentos básicos.',
    setup: desk,
    steps: [
      { text: 'Clique UMA vez no ícone "Lixeira" para selecioná-lo.', hint: 'Ele fica com um fundo azulado: isso significa "selecionado".', target: '[data-tut="icon-trash"]', on: 'desktop:select', when: d => d.key === 'trash' },
      { text: 'Agora dê um CLIQUE DUPLO (dois cliques rápidos) no ícone "Este Computador".', hint: 'Clique duas vezes seguidas, sem mexer o mouse entre os cliques.', target: '[data-tut="icon-pc"]', on: 'app:open', when: d => d.app === 'explorer' },
      { text: 'Feche a janela que abriu clicando no X, no canto superior direito dela.', target: `${win('explorer')} [data-act="close"]`, on: 'app:close', when: d => d.app === 'explorer' },
      { text: 'Clique com o BOTÃO DIREITO numa parte vazia da Área de Trabalho.', hint: 'Um menu com opções vai aparecer. Para fechá-lo sem escolher nada, clique fora dele.', on: 'ctx:open', when: d => d.target === 'desktop' },
      { text: 'Feche o menu clicando fora dele. Depois ARRASTE o ícone "Bem-vindo.txt": clique nele, segure o botão e solte em outro lugar.', target: '[data-tut="icon-f1"]', on: 'desktop:move' },
      { text: 'Para terminar, dê um clique duplo em "Bem-vindo.txt" para ler o que está escrito.', target: '[data-name="Bem-vindo.txt"]', on: 'app:open', when: d => d.app === 'notepad' },
    ],
    outro: 'Muito bem! Clique simples seleciona, clique duplo abre, botão direito mostra opções e arrastar move as coisas de lugar.',
  },
  {
    id: 'iniciar', level: 'Básico', title: 'Menu Iniciar e barra de tarefas', time: '4 min',
    desc: 'Abrir programas pelo menu, pesquisar e ver o calendário.',
    intro: 'O botão Iniciar (o logotipo azul na barra de tarefas) é a porta de entrada para todos os programas. A barra de tarefas mostra o que está aberto.',
    setup: desk,
    steps: [
      { text: 'Clique no botão Iniciar, o logotipo azul de quatro quadradinhos na barra de tarefas.', target: '[data-tut="start"]', on: 'start:open' },
      { text: 'No menu, clique em "Calculadora".', target: '[data-tut="sm-calculator"]', on: 'app:open', when: d => d.app === 'calculator' },
      { text: 'Abra o menu Iniciar de novo e digite "paint" (sem as aspas) na caixa de pesquisa.', hint: 'Você pode digitar assim que o menu abrir: a caixa de pesquisa já fica pronta.', target: '[data-tut="start"]', on: 'search:query', when: d => norm(d.q).includes('pai') },
      { text: 'Clique no resultado "Paint".', target: '[data-tut="sr-paint"]', on: 'app:open', when: d => d.app === 'paint' },
      { text: 'Clique no relógio, no canto direito da barra de tarefas, para ver o calendário.', target: '[data-tut="clock"]', on: 'calendar:open' },
      { text: 'Os programas abertos aparecem na barra de tarefas com um tracinho embaixo. Clique no ícone da Calculadora para trazê-la para a frente.', target: '[data-tut="tb-calculator"]', on: 'app:focus', when: d => d.app === 'calculator' },
    ],
    outro: 'Agora você sabe abrir qualquer programa pelo menu Iniciar ou pela pesquisa, e trocar de programa pela barra de tarefas.',
  },
  {
    id: 'janelas', level: 'Básico', title: 'Trabalhando com janelas', time: '5 min',
    desc: 'Minimizar, maximizar, mover, redimensionar e encaixar.',
    intro: 'Cada programa abre numa janela. No canto superior direito ficam três botões: – (minimizar), □ (maximizar) e X (fechar).',
    setup: async (os) => { await desk(os); os.openApp('notepad'); },
    steps: [
      { text: 'Minimize o Bloco de Notas clicando no botão "–" no canto superior direito da janela.', hint: 'Minimizar esconde a janela na barra de tarefas, sem fechar o programa.', target: `${win('notepad')} [data-act="min"]`, on: 'win:minimize', when: d => d.app === 'notepad' },
      { text: 'Traga a janela de volta clicando no ícone do Bloco de Notas na barra de tarefas.', target: '[data-tut="tb-notepad"]', on: 'win:restore', when: d => d.app === 'notepad' },
      { text: 'Maximize a janela (botão □) para ela ocupar a tela inteira.', target: `${win('notepad')} [data-act="max"]`, on: 'win:maximize' },
      { text: 'Volte ao tamanho anterior clicando no mesmo botão (agora ele mostra dois quadradinhos).', target: `${win('notepad')} [data-act="max"]`, on: 'win:unmaximize' },
      { text: 'Mova a janela: clique na barra de título (a faixa de cima, onde está escrito "Bloco de Notas"), segure e arraste.', target: `${win('notepad')} .w-title`, on: 'win:move' },
      { text: 'Mude o tamanho: leve o mouse até o canto inferior direito da janela, segure e arraste.', hint: 'O cursor vira uma setinha dupla quando está no lugar certo.', target: `${win('notepad')} .w-rs.se`, on: 'win:resize' },
      { text: 'Encaixe a janela na metade esquerda da tela: arraste a barra de título até o mouse encostar na borda esquerda.', hint: 'Uma sombra mostra onde a janela vai ficar. Solte o botão quando ela aparecer.', on: 'win:snap' },
      { text: 'Feche a janela no X.', target: `${win('notepad')} [data-act="close"]`, on: 'app:close', when: d => d.app === 'notepad' },
    ],
    outro: 'Excelente! Com esses movimentos você organiza vários programas na tela ao mesmo tempo.',
  },
  {
    id: 'pastas', level: 'Básico', title: 'Pastas: organizando arquivos', time: '4 min',
    desc: 'Explorador de Arquivos, criar e renomear pastas.',
    intro: 'Arquivos são como folhas de papel e pastas são como envelopes para organizá-los. O Explorador de Arquivos é o programa que mostra tudo isso.',
    setup: async (os) => { await desk(os); const ex = os.fs.findByName(SPECIAL.DOCS, 'Minhas Receitas'); if (ex) os.fs.purge(ex.id); },
    steps: [
      { text: 'Abra o Explorador de Arquivos clicando no ícone de pasta amarela na barra de tarefas.', target: '[data-tut="tb-explorer"]', on: 'app:open', when: d => d.app === 'explorer' },
      { text: 'No painel da esquerda, clique em "Documentos".', target: '[data-tut="nav-docs"]', on: 'explorer:navigate', when: d => d.folder === SPECIAL.DOCS },
      { text: 'Crie uma pasta: clique em "Novo" e depois em "Pasta".', target: '[data-tut="cmd-new"]', on: 'fs:create', when: d => d.node.type === 'folder' },
      { text: 'Apague o nome "Nova pasta", digite Minhas Receitas e aperte Enter.', hint: 'Se o nome não estiver mais selecionado, clique na pasta e aperte a tecla F2 para renomear.', check: os => !!os.fs.findByName(SPECIAL.DOCS, 'Minhas Receitas'), on: 'fs:rename' },
      { text: 'Dê um clique duplo na pasta "Minhas Receitas" para entrar nela.', target: '[data-name="Minhas Receitas"]', on: 'explorer:navigate', when: d => norm(d.name) === 'minhas receitas' },
      { text: 'Volte para "Documentos" usando a seta para cima (↑) ou a seta de voltar (←), no alto da janela.', target: '[data-tut="ex-up"]', on: 'explorer:navigate', when: d => d.folder === SPECIAL.DOCS },
    ],
    outro: 'Agora você sabe criar pastas e navegar entre elas. Organize suas coisas assim: uma pasta para fotos da família, outra para documentos, etc.',
  },
  {
    id: 'texto', level: 'Básico', title: 'Escrevendo e salvando um texto', time: '5 min',
    desc: 'Bloco de Notas, salvar com nome e abrir de novo.',
    intro: 'Tudo o que você escreve só fica guardado de verdade depois de "salvar". Vamos criar um texto, dar um nome a ele e encontrá-lo depois.',
    setup: desk,
    steps: [
      { text: 'Abra o Bloco de Notas pelo menu Iniciar.', target: '[data-tut="start"]', on: 'app:open', when: d => d.app === 'notepad' },
      { text: 'Escreva uma frase, por exemplo: Minha primeira anotação', target: '[data-tut="np-text"]', on: 'notepad:type', when: d => d.text.trim().length >= 5 },
      { text: 'Clique em "Arquivo" e depois em "Salvar como..." (ou aperte Ctrl+S).', target: '[data-tut="np-file"]', on: 'filedlg:open', when: d => d.mode === 'save' },
      { text: 'Na caixa "Nome do arquivo", escreva Anotação e clique em "Salvar".', hint: 'Repare que o arquivo vai para a pasta Documentos.', target: '[data-tut="fd-name"]', on: 'notepad:save', when: (d, os, mem) => { mem.saved = d.node.id; return true; } },
      { text: 'Feche o Bloco de Notas no X.', on: 'app:close', when: d => d.app === 'notepad' },
      { text: 'Encontre o arquivo: abra o Explorador de Arquivos, entre em Documentos e dê um clique duplo nele.', target: '[data-tut="tb-explorer"]', on: 'file:open', when: (d, os, mem) => d.node.id === mem.saved },
    ],
    outro: 'Perfeito! Salvar = guardar com um nome numa pasta. Use Ctrl+S com frequência para não perder nada.',
  },
  {
    id: 'copiar', level: 'Intermediário', title: 'Copiar, mover e excluir', time: '6 min',
    desc: 'Copiar e colar, Lixeira, restaurar e esvaziar.',
    intro: 'Copiar cria uma cópia em outro lugar. Excluir manda o arquivo para a Lixeira, de onde dá para recuperá-lo até ela ser esvaziada.',
    setup: async (os) => {
      await desk(os);
      if (!os.fs.findByName(SPECIAL.DOCS, 'Lista de compras.txt')) os.fs.create(SPECIAL.DOCS, 'Lista de compras.txt', 'file', { content: 'Arroz\nFeijão\nCafé' });
      for (const n of os.fs.children(SPECIAL.DESKTOP)) if (n.name.startsWith('Lista de compras')) os.fs.purge(n.id);
    },
    steps: [
      { text: 'Abra o Explorador de Arquivos e entre em "Documentos".', target: '[data-tut="tb-explorer"]', on: 'explorer:navigate', when: d => d.folder === SPECIAL.DOCS },
      { text: 'Clique UMA vez em "Lista de compras.txt" e depois no botão Copiar (ou aperte Ctrl+C).', target: '[data-tut="cmd-copy"]', on: 'clipboard', when: d => d.mode === 'copy' },
      { text: 'Vá para "Área de Trabalho" (no painel da esquerda) e clique em Colar (ou aperte Ctrl+V).', target: '[data-tut="nav-desktop"]', on: 'fs:copy', when: d => d.to === SPECIAL.DESKTOP },
      { text: 'Agora exclua essa cópia: com ela selecionada, clique no botão da lixeira (ou aperte Delete).', target: '[data-tut="cmd-delete"]', on: 'fs:delete' },
      { text: 'Abra a "Lixeira" no painel da esquerda.', target: '[data-tut="nav-trash"]', on: 'explorer:navigate', when: d => d.folder === SPECIAL.TRASH },
      { text: 'Selecione o arquivo e clique em "Restaurar os itens selecionados". Ele volta para a Área de Trabalho.', target: '[data-tut="cmd-restore"]', on: 'fs:restore' },
      { text: 'Exclua o arquivo de novo e, na Lixeira, clique em "Esvaziar Lixeira" para apagar de vez.', hint: 'Depois de esvaziar, não tem volta. Por isso o Windows pede confirmação.', on: 'fs:empty' },
    ],
    outro: 'Ótimo! Lembre: a Lixeira é uma segunda chance. Só esvazie quando tiver certeza.',
  },
  {
    id: 'personalizar', level: 'Intermediário', title: 'Deixando o computador com a sua cara', time: '4 min',
    desc: 'Papel de parede, modo escuro, cores e seu nome.',
    intro: 'Nas Configurações você muda a aparência do Windows. Não tenha medo de experimentar: tudo pode ser desfeito.',
    setup: desk,
    steps: [
      { text: 'Clique com o botão direito numa área vazia da Área de Trabalho e escolha "Personalizar".', target: '[data-tut="ctx-personalize"]', on: 'settings:page', when: d => d.page === 'personalization' },
      { text: 'Escolha um novo plano de fundo clicando numa das imagens.', target: '[data-tut="wall-praia"]', on: 'settings:wallpaper' },
      { text: 'Em "Escolha o modo", mude para "Escuro".', target: '[data-tut="set-theme"]', on: 'settings:theme', when: d => d.theme === 'dark' },
      { text: 'Escolha uma cor de destaque que você goste.', target: '[data-tut="accent-e3008c"]', on: 'settings:accent' },
      { text: 'No menu da esquerda, abra "Contas", escreva seu nome e clique em "Salvar".', target: '[data-tut="set-accounts"]', on: 'settings:username' },
    ],
    outro: 'Seu Windows agora está do seu jeito! Se quiser voltar ao normal, é só escolher o modo "Claro" de novo.',
  },
  {
    id: 'internet', level: 'Intermediário', title: 'Wi-Fi e navegador', time: '7 min',
    desc: 'Conectar à internet, pesquisar, abrir guias e baixar arquivos.',
    intro: 'Para usar a internet, primeiro o computador precisa estar conectado a uma rede Wi-Fi. Depois, o navegador é o programa que abre os sites.',
    setup: async (os) => { await desk(os); os.set({ wifi: { on: true, connected: null, known: [] }, airplane: false }); },
    steps: [
      { text: 'Clique nos ícones de rede, som e bateria, no canto direito da barra de tarefas.', target: '[data-tut="quick"]', on: 'quick:open' },
      { text: 'Clique na setinha ao lado do botão Wi-Fi para ver as redes disponíveis.', target: '.w-tile-more', on: 'quick:wifi' },
      { text: 'Clique na rede "Casa_Silva" e digite a senha: familia2024', hint: 'A senha do Wi-Fi geralmente fica numa etiqueta embaixo do roteador.', target: '[data-tut="net-Casa_Silva"]', on: 'wifi:connect', when: d => d.ssid === 'Casa_Silva' },
      { text: 'Abra o Navegador (ícone redondo azul e verde na barra de tarefas).', target: '[data-tut="tb-browser"]', on: 'app:open', when: d => d.app === 'browser' },
      { text: 'Clique na barra de endereço, no alto, digite receita de bolo de cenoura e aperte Enter.', target: '[data-tut="br-address"]', on: 'browser:search', when: d => norm(d.q).includes('bolo') },
      { text: 'Clique no primeiro resultado da pesquisa.', target: '[data-tut="res-first"]', on: 'browser:navigate', when: d => d.host === 'receitas.com.br' && d.path.includes('bolo') },
      { text: 'Desça a página e clique em "Baixar receita em PDF".', target: '[data-tut="dl-recipe"]', on: 'browser:download' },
      { text: 'Abra uma nova guia clicando no "+" ao lado da guia atual.', hint: 'Guias deixam você ter vários sites abertos na mesma janela.', target: '[data-tut="br-newtab"]', on: 'browser:newtab' },
      { text: 'Encontre o arquivo baixado: abra o Explorador de Arquivos e entre em "Downloads".', target: '[data-tut="tb-explorer"]', on: 'explorer:navigate', when: d => d.folder === SPECIAL.DOWNLOADS },
    ],
    outro: 'Muito bem! Tudo que você baixa da internet vai para a pasta Downloads.',
  },
  {
    id: 'golpes', level: 'Intermediário', title: 'Segurança: reconhecendo golpes', time: '6 min',
    desc: 'Sites falsos, cadeado e endereço certo.',
    intro: 'Golpistas criam sites falsos parecidos com os verdadeiros para roubar senhas. Aqui você vai ver um site falso de propósito, num ambiente seguro, para aprender a reconhecer os sinais.',
    setup: async (os) => { await desk(os); os.set({ wifi: { on: true, connected: 'Casa_Silva', known: ['Casa_Silva'] }, airplane: false }); os.openApp('browser', { url: 'busca.com.br' }); },
    steps: [
      { text: 'No navegador, pesquise: prêmio do banco', target: '[data-tut="br-address"]', on: 'browser:search', when: d => /banco|premio/.test(norm(d.q)) },
      { text: 'Repare no resultado marcado como "Patrocinado". Clique nele para ver como é um site falso (é só treino).', target: '[data-tut="res-phish"]', on: 'browser:phish', when: d => d.action === 'visit' },
      { text: 'Olhe o endereço no alto: aparece "Não seguro" e o nome é estranho. Não digite nada! Clique em "Sair deste site".', target: '[data-tut="phish-leave"]', on: 'browser:phish', when: d => d.action === 'leave' || d.action === 'submit' },
      { text: 'Agora digite o endereço verdadeiro do banco na barra de endereço: meubanco.com.br', target: '[data-tut="br-address"]', on: 'browser:navigate', when: d => d.host === 'meubanco.com.br' },
      { quiz: { q: 'Qual destes endereços é do site verdadeiro do banco?', options: ['meubanco-premiado.xyz', 'meubanco.com.br', 'meubanco.com.br.ganhe-ja.net'], correct: 1, explain: 'O endereço precisa ser exatamente o do banco. Palavras a mais, antes ou depois, são sinal de golpe.' } },
      { quiz: { q: 'O banco mandou mensagem pedindo sua senha por um link. O que fazer?', options: ['Clicar e digitar a senha rápido', 'Ignorar e ligar para o banco pelo número do cartão', 'Responder com a senha'], correct: 1, explain: 'Bancos nunca pedem senha por mensagem, e-mail ou ligação. Na dúvida, ligue você mesmo para o número oficial.' } },
    ],
    outro: 'Parabéns! Sinais de golpe: endereço estranho, "Não seguro", pressa, prêmios inesperados e pedido de senha.',
  },
  {
    id: 'calcpaint', level: 'Intermediário', title: 'Calculadora e Paint', time: '6 min',
    desc: 'Fazer contas e desenhar.',
    intro: 'O Windows vem com programas úteis. A Calculadora resolve contas do dia a dia e o Paint permite desenhar.',
    setup: desk,
    steps: [
      { text: 'Abra a Calculadora (pelo menu Iniciar ou pela pesquisa).', target: '[data-tut="start"]', on: 'app:open', when: d => d.app === 'calculator' },
      { text: 'Calcule 125 + 37 e aperte "=".', hint: 'Você pode clicar nos botões ou usar os números do teclado.', target: '[data-tut="calc-display"]', on: 'calc:result', when: d => Math.abs(d.value - 162) < 0.001 },
      { text: 'Agora um desconto de 15% em R$ 80: calcule 80 × 0,85 e aperte "=".', hint: 'O "×" é a multiplicação. A vírgula fica ao lado do zero.', on: 'calc:result', when: d => Math.abs(d.value - 68) < 0.001 },
      { text: 'Abra o Paint.', target: '[data-tut="start"]', on: 'app:open', when: d => d.app === 'paint' },
      { text: 'Escolha uma cor e desenhe algo na área branca com o pincel.', target: '[data-tut="paint-brush"]', on: 'paint:draw', when: d => d.tool !== 'fill' },
      { text: 'Use o balde de tinta para pintar uma área fechada.', target: '[data-tut="paint-fill"]', on: 'paint:draw', when: d => d.tool === 'fill' },
      { text: 'Salve seu desenho: Arquivo > Salvar. Ele vai para a pasta Imagens.', target: '[data-tut="paint-file"]', on: 'paint:save' },
    ],
    outro: 'Muito bem! Seu desenho ficou salvo em Imagens. Dá até para colocá-lo como papel de parede.',
  },
  {
    id: 'instalar', level: 'Avançado', title: 'Instalando e desinstalando programas', time: '5 min',
    desc: 'Loja de aplicativos e remover o que não usa.',
    intro: 'Programas novos devem ser instalados de lugares confiáveis, como a Loja. E o que você não usa mais pode ser desinstalado para liberar espaço.',
    setup: async (os) => { await desk(os); os.set({ installed: os.settings.installed.filter(a => a !== 'minesweeper'), pinned: os.settings.pinned.filter(a => a !== 'minesweeper') }); os.renderTaskbar(); },
    steps: [
      { text: 'Abra a Loja (ícone de sacola na barra de tarefas).', target: '[data-tut="tb-store"]', on: 'app:open', when: d => d.app === 'store' },
      { text: 'Encontre o "Campo Minado" e clique em "Instalar".', target: '[data-tut="store-install-minesweeper"]', on: 'store:install', when: d => d.app === 'minesweeper' },
      { text: 'Clique em "Abrir" para jogar.', target: '[data-tut="store-open-minesweeper"]', on: 'app:open', when: d => d.app === 'minesweeper' },
      { text: 'Jogue um pouco e depois feche o jogo.', on: 'app:close', when: d => d.app === 'minesweeper' },
      { text: 'Agora vamos desinstalar: abra o menu Iniciar > Configurações > Aplicativos.', target: '[data-tut="start"]', on: 'settings:page', when: d => d.page === 'apps' },
      { text: 'Clique em "Desinstalar" ao lado de Campo Minado e confirme.', target: '[data-tut="uninstall-minesweeper"]', on: 'app:uninstall', when: d => d.app === 'minesweeper' },
    ],
    outro: 'Pronto! Instale pela Loja ou pelo site oficial e desinstale pelas Configurações.',
  },
  {
    id: 'travou', level: 'Avançado', title: 'Quando um programa trava', time: '4 min',
    desc: 'Gerenciador de Tarefas e finalizar tarefa.',
    intro: 'Às vezes um programa para de responder: a janela fica esbranquiçada e o título mostra "Não está respondendo". O Gerenciador de Tarefas resolve isso.',
    setup: async (os) => {
      await desk(os);
      const w = os.openApp('notepad');
      setTimeout(() => { if (w && os.windows.includes(w)) { os.freeze(w); os.notify('Bloco de Notas', 'O programa não está respondendo.', 'notepad'); } }, 900);
    },
    steps: [
      { text: 'O Bloco de Notas travou. Clique com o botão direito numa parte vazia da barra de tarefas.', hint: 'Atalho: Ctrl+Shift+Esc abre o Gerenciador direto (use o botão na barra de teclas acima da tela).', on: 'ctx:open', when: d => d.target === 'taskbar', check: os => !!os.windows.find(w => w.app === 'taskmgr') },
      { text: 'Clique em "Gerenciador de Tarefas".', target: '[data-tut="ctx-taskmgr"]', on: 'app:open', when: d => d.app === 'taskmgr', check: os => !!os.windows.find(w => w.app === 'taskmgr') },
      { text: 'Na lista, clique no Bloco de Notas (ele aparece como "Não está respondendo").', target: '[data-tut="tm-row-notepad"]', on: 'taskmgr:select', when: d => d.app === 'notepad' },
      { text: 'Clique em "Finalizar tarefa".', target: '[data-tut="tm-end"]', on: 'frozen:resolved' },
    ],
    outro: 'Resolvido! Finalizar tarefa fecha o programa à força. O que não estava salvo nele se perde, por isso salve sempre.',
  },
  {
    id: 'atalhos', level: 'Avançado', title: 'Atalhos de teclado', time: '5 min',
    desc: 'Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+S e mais.',
    intro: 'Atalhos são combinações de teclas que fazem tarefas comuns mais rápido. Segure a primeira tecla (Ctrl) e aperte a segunda.',
    setup: async (os) => { await desk(os); os.openApp('notepad'); },
    steps: [
      { text: 'Escreva duas palavras no Bloco de Notas, por exemplo: bom dia', target: '[data-tut="np-text"]', on: 'notepad:type', when: d => d.text.trim().split(/\s+/).length >= 2 },
      { text: 'Selecione todo o texto com Ctrl+A (segure Ctrl e aperte A).', on: 'shortcut', when: d => d.combo === 'ctrl+a' },
      { text: 'Copie com Ctrl+C.', on: 'shortcut', when: d => d.combo === 'ctrl+c' },
      { text: 'Aperte a seta → do teclado para ir ao fim do texto e cole com Ctrl+V.', on: 'shortcut', when: d => d.combo === 'ctrl+v' },
      { text: 'Desfaça a colagem com Ctrl+Z.', on: 'shortcut', when: d => d.combo === 'ctrl+z' },
      { text: 'Salve com Ctrl+S (escolha um nome e clique em Salvar).', on: 'notepad:save' },
      { text: 'Na barra de teclas acima da tela, clique em "Win + D" para mostrar a Área de Trabalho.', hint: 'Win + D minimiza tudo de uma vez. Aperte de novo para trazer as janelas de volta.', target: null, on: 'shortcut', when: d => d.combo === 'win+d' },
    ],
    outro: 'Os atalhos que valem ouro: Ctrl+C (copiar), Ctrl+V (colar), Ctrl+Z (desfazer) e Ctrl+S (salvar).',
  },
  {
    id: 'desligar', level: 'Básico', title: 'Desligar, reiniciar e suspender', time: '3 min',
    desc: 'O jeito certo de desligar o computador.',
    intro: 'Desligar pelo menu dá tempo para o Windows salvar tudo. Tirar da tomada pode estragar arquivos.',
    setup: desk,
    steps: [
      { text: 'Abra o menu Iniciar.', target: '[data-tut="start"]', on: 'start:open' },
      { text: 'Clique no botão Ligar/Desligar, no canto inferior direito do menu.', target: '[data-tut="power"]', on: 'power:menu' },
      { text: 'Escolha "Reiniciar" e espere o computador voltar.', hint: 'Reiniciar resolve muitos problemas: desliga e liga de novo sozinho.', target: '[data-tut="pw-restart"]', on: 'power', when: d => d.state === 'restart' },
      { text: 'Na tela de bloqueio, clique em qualquer lugar e depois em "Entrar".', on: 'power', when: d => d.state === 'login' },
      { text: 'Agora desligue: Iniciar > Ligar/Desligar > Desligar.', target: '[data-tut="start"]', on: 'power', when: d => d.state === 'shutdown' },
    ],
    outro: 'Você concluiu! Lembre-se: "Suspender" deixa o PC dormindo para voltar rápido; "Desligar" desliga de verdade.',
  },
];
