import { h, clear } from '../ui.js';

const TERMS = [
  ['Hardware', 'Básico', 'As partes físicas do computador, que dá para tocar: teclado, mouse, processador, memória…'],
  ['Software', 'Básico', 'Os programas: tudo que roda dentro do computador, como o Windows, o navegador e os jogos.'],
  ['Sistema operacional', 'Básico', 'O programa principal, que faz o computador funcionar e deixa você usar os outros programas. Ex.: Windows, macOS, Linux.'],
  ['Programa / aplicativo', 'Básico', 'Uma ferramenta que você abre para fazer algo: escrever, ver fotos, navegar. "App" é a abreviação.'],
  ['Arquivo', 'Básico', 'Qualquer coisa guardada no computador: um texto, uma foto, uma música, um vídeo.'],
  ['Pasta', 'Básico', 'Um "envelope" para organizar arquivos. Uma pasta pode ter outras pastas dentro.'],
  ['Extensão', 'Básico', 'As letras depois do ponto no nome do arquivo, que dizem o tipo dele: .txt (texto), .jpg (foto), .mp3 (música).'],
  ['Clique duplo', 'Windows', 'Apertar o botão esquerdo do mouse duas vezes rápido. Serve para abrir arquivos e programas.'],
  ['Botão direito', 'Windows', 'Abre um menu com opções sobre o que está embaixo do mouse (copiar, renomear, excluir…).'],
  ['Área de trabalho', 'Windows', 'A tela principal do Windows, com o papel de parede e os ícones.'],
  ['Barra de tarefas', 'Windows', 'A faixa embaixo da tela com o botão Iniciar, os programas abertos e o relógio.'],
  ['Menu Iniciar', 'Windows', 'O menu do botão com o logotipo do Windows. Dali você abre programas e desliga o PC.'],
  ['Janela', 'Windows', 'O retângulo onde cada programa aparece. Pode ser minimizada, maximizada e fechada.'],
  ['Minimizar', 'Windows', 'Esconder a janela na barra de tarefas sem fechar o programa.'],
  ['Maximizar', 'Windows', 'Fazer a janela ocupar a tela inteira.'],
  ['Explorador de Arquivos', 'Windows', 'O programa para ver, organizar, copiar e apagar seus arquivos e pastas.'],
  ['Lixeira', 'Windows', 'Para onde vão os arquivos excluídos. Dá para restaurar de lá, até você esvaziá-la.'],
  ['Atalho de teclado', 'Windows', 'Combinação de teclas que faz algo rápido. Ex.: Ctrl+C copia, Ctrl+V cola, Ctrl+Z desfaz.'],
  ['Copiar e colar', 'Windows', 'Copiar (Ctrl+C) guarda algo na memória; colar (Ctrl+V) coloca uma cópia onde você quiser.'],
  ['Recortar', 'Windows', 'Como copiar, mas o original sai do lugar quando você cola (Ctrl+X). Serve para mover.'],
  ['Área de transferência', 'Windows', 'O lugar invisível onde fica o que você copiou ou recortou, esperando ser colado.'],
  ['Download / baixar', 'Internet', 'Trazer um arquivo da internet para o seu computador. Normalmente vai para a pasta Downloads.'],
  ['Upload / enviar', 'Internet', 'Mandar um arquivo do seu computador para a internet (anexar num e-mail, postar uma foto).'],
  ['Navegador', 'Internet', 'O programa para acessar sites: Chrome, Edge, Firefox, Safari.'],
  ['Site / página', 'Internet', 'Um endereço na internet com conteúdo, como www.exemplo.com.br.'],
  ['Endereço (URL)', 'Internet', 'O "endereço da casa" de um site, que aparece no alto do navegador. Sempre confira antes de digitar senhas.'],
  ['Wi-Fi', 'Internet', 'Internet sem fio. Você escolhe a rede e digita a senha uma vez.'],
  ['Aba', 'Internet', 'Cada página aberta no navegador ganha uma aba no topo. Dá para ter várias ao mesmo tempo.'],
  ['Cadeado (HTTPS)', 'Segurança', 'O cadeado ao lado do endereço indica conexão protegida. Mas atenção: golpistas também podem ter cadeado.'],
  ['Phishing (golpe do link falso)', 'Segurança', 'Mensagem ou site falso que imita um banco ou loja para roubar sua senha. Desconfie de prêmios e urgência.'],
  ['Senha forte', 'Segurança', 'Senha longa, com letras, números e símbolos, diferente para cada site. Ex.: uma frase como Cafe!Com3Bolachas.'],
  ['Vírus / malware', 'Segurança', 'Programa malicioso que pode roubar dados ou estragar o computador. Só baixe programas de fontes confiáveis.'],
  ['Antivírus', 'Segurança', 'Programa que procura e bloqueia vírus. O Windows já vem com um (Windows Defender).'],
  ['Atualização', 'Segurança', 'Melhorias e correções de segurança. Manter o Windows e os programas atualizados protege você.'],
  ['Backup', 'Segurança', 'Uma cópia de segurança dos seus arquivos em outro lugar (HD externo ou nuvem), caso algo dê errado.'],
  ['Nuvem', 'Internet', 'Guardar arquivos em computadores de empresas pela internet (Google Drive, OneDrive), acessíveis de qualquer lugar.'],
  ['Processador (CPU)', 'Hardware', 'O cérebro do computador: executa as instruções dos programas.'],
  ['Núcleo', 'Hardware', 'Cada "mini cérebro" dentro do processador. Mais núcleos = mais tarefas pesadas ao mesmo tempo.'],
  ['GHz (gigahertz)', 'Hardware', 'Medida de velocidade do processador: quantos bilhões de ciclos ele faz por segundo.'],
  ['Memória RAM', 'Hardware', 'A memória rápida e temporária, onde ficam os programas abertos. Esvazia quando desliga.'],
  ['Dual channel', 'Hardware', 'Usar dois pentes de memória iguais para dobrar a "estrada" de dados até o processador.'],
  ['SSD', 'Hardware', 'Armazenamento sem peças móveis, muito mais rápido que o HD. Deixa o PC ligar em segundos.'],
  ['HD (disco rígido)', 'Hardware', 'Armazenamento com um disco girando dentro. Barato e grande, mas lento.'],
  ['M.2 / NVMe', 'Hardware', 'Formato de SSD em "plaquinha" que encaixa direto na placa-mãe. O NVMe é o mais rápido.'],
  ['GB e TB', 'Hardware', 'Medidas de tamanho. 1 TB (terabyte) = 1.000 GB (gigabytes). Uma foto tem uns 3 MB; um filme, uns 2 GB.'],
  ['Placa de vídeo (GPU)', 'Hardware', 'Peça que desenha as imagens na tela. Fundamental para jogos, edição de vídeo e IA.'],
  ['VRAM', 'Hardware', 'A memória própria da placa de vídeo. Jogos atuais pedem 8 GB ou mais.'],
  ['Vídeo integrado', 'Hardware', 'Um chip de vídeo simples dentro do processador. Dispensa placa de vídeo para usos leves.'],
  ['Placa-mãe', 'Hardware', 'A placa principal, onde todas as outras peças se conectam.'],
  ['Soquete', 'Hardware', 'O encaixe do processador na placa-mãe. Os dois precisam ser do mesmo tipo (ex.: AM5, LGA1700).'],
  ['Fonte (PSU)', 'Hardware', 'Converte a energia da tomada para as peças. Medida em watts (W).'],
  ['Watt (W)', 'Hardware', 'Medida de energia. Quanto mais forte o PC, mais watts ele consome e maior a fonte necessária.'],
  ['Cooler', 'Hardware', 'O sistema que esfria o processador: dissipador de metal com ventoinha ou water cooler.'],
  ['Pasta térmica', 'Hardware', 'Uma pasta cinza passada entre o processador e o cooler para o calor passar melhor.'],
  ['Gargalo', 'Hardware', 'Quando uma peça fraca segura o desempenho das outras. Ex.: placa de vídeo top com processador antigo.'],
  ['FPS', 'Jogos', 'Quadros por segundo: quantas imagens o jogo mostra por segundo. 60 é fluido; abaixo de 30 trava.'],
  ['Resolução', 'Jogos', 'Quantidade de pontinhos na tela. 1080p (Full HD), 1440p (2K) e 4K. Mais resolução exige placa mais forte.'],
  ['Ray Tracing', 'Jogos', 'Técnica que simula luz e reflexos de forma realista. Muito bonita, mas pesada.'],
  ['DLSS / FSR', 'Jogos', 'Tecnologias que usam inteligência artificial para ganhar FPS mantendo a imagem bonita.'],
  ['BIOS / UEFI', 'Hardware', 'O programa básico da placa-mãe, que roda antes do Windows e testa as peças ao ligar.'],
  ['Overclock', 'Hardware', 'Fazer uma peça funcionar acima da velocidade de fábrica. Ganha desempenho, mas esquenta mais.'],
  ['RGB', 'Hardware', 'Luzes coloridas nas peças. Só enfeite: não deixam o PC mais rápido.'],
];

export function mount(root) {
  let q = '';
  let tag = 'Todos';
  const tags = ['Todos', ...new Set(TERMS.map(t => t[1]))];
  const list = h('dl', { class: 'gloss' });
  const tabs = h('div', { class: 'tabs' });

  root.appendChild(h('div', { class: 'page' },
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Dicionário'),
      h('h1', {}, 'Palavras de computador, explicadas'),
      h('p', { class: 'lead' }, `${TERMS.length} termos que aparecem no dia a dia, sem complicação.`),
    ),
    h('div', { class: 'toolbar', style: { marginBottom: '18px' } },
      h('input', { class: 'input', id: 'gloss-q', type: 'search', placeholder: 'Procure uma palavra…', 'aria-label': 'Procurar no dicionário', style: { flex: '1 1 260px' }, oninput: (e) => { q = e.target.value; render(); } }),
      tabs,
    ),
    list,
  ));

  function render() {
    clear(tabs);
    for (const t of tags) tabs.appendChild(h('button', { class: 'tab', type: 'button', 'aria-selected': String(t === tag), onclick: () => { tag = t; render(); } }, t));
    clear(list);
    const ql = norm(q);
    const items = TERMS.filter(([term, tg, def]) => (tag === 'Todos' || tg === tag) && (!ql || norm(term + ' ' + def).includes(ql)))
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    for (const [term, tg, def] of items) {
      list.appendChild(h('div', { class: 'card' }, h('span', { class: 'tagline' }, tg), h('dt', {}, term), h('dd', {}, def)));
    }
    if (!items.length) list.appendChild(h('div', { class: 'empty' }, 'Nenhum termo encontrado.'));
  }
  render();
}

function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
