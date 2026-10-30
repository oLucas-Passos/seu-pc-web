// Navegador com sites de mentira para treinar: busca, notícias, receitas, banco, loja e golpes.
import { lico, icon } from '../icons.js';
import { SPECIAL } from '../fs.js';
import { esc } from './common.js';

const SECURE = new Set(['busca.com.br', 'noticias.com.br', 'receitas.com.br', 'clima.com.br', 'meubanco.com.br', 'loja.com.br', 'videos.com.br', 'enciclopedia.org', 'nova-aba', 'arquivo']);
const FAVS = [
  ['busca.com.br', 'Buscador'], ['noticias.com.br', 'Notícias'], ['receitas.com.br', 'Receitas'],
  ['meubanco.com.br', 'Meu Banco'], ['loja.com.br', 'Loja'], ['videos.com.br', 'Vídeos'], ['clima.com.br', 'Clima'],
];
const INDEX = [
  { kw: 'receita bolo cenoura doce cozinha', url: 'receitas.com.br/bolo-de-cenoura', title: 'Bolo de cenoura com cobertura de chocolate - Receitas', desc: 'Receita fácil e fofinha, pronta em 50 minutos. Baixe a receita em PDF para imprimir.' },
  { kw: 'receita pão queijo cozinha', url: 'receitas.com.br', title: 'Receitas: as melhores receitas do Brasil', desc: 'Milhares de receitas testadas, do café da manhã ao jantar.' },
  { kw: 'banco conta saldo pix', url: 'meubanco.com.br', title: 'Meu Banco - Acesse sua conta', desc: 'Site oficial. Acesse sua conta com segurança.' },
  { kw: 'noticias notícia jornal hoje', url: 'noticias.com.br', title: 'Notícias - As principais notícias do dia', desc: 'Tecnologia, economia, esportes e muito mais.' },
  { kw: 'clima tempo previsão chuva sol', url: 'clima.com.br', title: 'Previsão do tempo para hoje', desc: 'Veja se vai chover na sua cidade.' },
  { kw: 'comprar loja celular fone oferta', url: 'loja.com.br', title: 'Loja - Ofertas em eletrônicos', desc: 'Compre com segurança e frete grátis acima de R$ 99.' },
  { kw: 'video vídeo assistir filme gatinho', url: 'videos.com.br', title: 'Vídeos - assista de graça', desc: 'Os vídeos mais vistos da semana.' },
  { kw: 'computador pc o que é história processador', url: 'enciclopedia.org/computador', title: 'Computador - Enciclopédia Livre', desc: 'Um computador é uma máquina que processa informações...' },
  { kw: 'baixar programa gratis grátis download jogo', url: 'programas-gratis.net', title: 'Baixar programas grátis!!! Download rápido', desc: 'Todos os programas de graça, sem cadastro, clique e baixe.' },
];

export default {
  id: 'browser', name: 'Navegador', icon: 'browser', width: 1000, height: 640, single: true, keywords: 'internet site navegar edge chrome web',
  open(ctx) {
    const { os, body, args } = ctx;
    const fs = os.fs;
    let tabs = [], active = null, seq = 0;
    body.classList.add('br');
    body.innerHTML = `<div class="br-tabs"><div class="br-tablist"></div><button class="w-ib sm" data-newtab data-tut="br-newtab" title="Nova guia (Ctrl+T)">${lico('plus', 16)}</button></div>
      <div class="br-nav"><button class="w-ib" data-a="back" title="Voltar" data-tut="br-back">${lico('back')}</button><button class="w-ib" data-a="fwd" title="Avançar">${lico('fwd')}</button>
      <button class="w-ib" data-a="reload" title="Atualizar">${lico('refresh')}</button><button class="w-ib" data-a="home" title="Página inicial">${lico('home')}</button>
      <div class="br-addr"><span class="br-sec"></span><input data-tut="br-address" spellcheck="false" aria-label="Endereço"></div>
      <button class="w-ib" data-a="dls" title="Downloads" data-tut="br-downloads">${lico('download')}</button></div>
      <div class="br-favs">${FAVS.map(([u, n]) => `<button data-fav="${u}" data-tut="fav-${u}">${esc(n)}</button>`).join('')}</div>
      <div class="br-page"></div><div class="br-dl" hidden></div>`;
    const $ = s => body.querySelector(s);
    const page = $('.br-page');
    const addr = $('.br-addr input');

    function newTab(url = 'nova-aba', focus = true) {
      const t = { id: ++seq, url, title: 'Nova guia', hist: [url], hi: 0 };
      tabs.push(t);
      if (focus) { active = t; load(t, url, false); }
      renderTabs();
      return t;
    }
    function closeTab(t) {
      const i = tabs.indexOf(t);
      tabs.splice(i, 1);
      os.emit('browser:closetab', {});
      if (!tabs.length) { os.close(ctx.win); return; }
      if (active === t) { active = tabs[Math.max(0, i - 1)]; load(active, active.url, false); }
      renderTabs();
    }
    function renderTabs() {
      const L = $('.br-tablist');
      L.innerHTML = tabs.map(t => `<div class="br-tab${t === active ? ' on' : ''}" data-tab="${t.id}"><span class="br-fav">${t.url.startsWith('arquivo') ? icon('pdf', 14) : lico('globe', 14)}</span><span class="br-tt">${esc(t.title)}</span><button class="br-x" data-close="${t.id}" title="Fechar guia">${lico('close', 12)}</button></div>`).join('');
      L.querySelectorAll('[data-tab]').forEach(d => { d.onclick = (e) => { if (e.target.closest('[data-close]')) return; const t = tabs.find(x => x.id === +d.dataset.tab); active = t; load(t, t.url, false); renderTabs(); }; });
      L.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => closeTab(tabs.find(x => x.id === +b.dataset.close)); });
    }

    function normalize(input) {
      let v = input.trim();
      if (!v) return null;
      if (v.startsWith('arquivo://')) return v;
      const looksUrl = !/\s/.test(v) && /\.[a-z]{2,}/i.test(v);
      if (!looksUrl) return 'busca.com.br/?q=' + encodeURIComponent(v);
      return v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
    }
    function go(input) {
      const url = normalize(input);
      if (!url) return;
      const t = active;
      t.hist = t.hist.slice(0, t.hi + 1);
      t.hist.push(url);
      t.hi = t.hist.length - 1;
      load(t, url, true);
    }
    function load(t, url, emit = true) {
      t.url = url;
      const host = url.startsWith('arquivo://') ? 'arquivo' : url.split(/[/?]/)[0];
      const path = url.slice(host.length).split('?')[0];
      const query = new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
      page.scrollTop = 0;
      page.className = 'br-page';
      let title;
      if (host !== 'nova-aba' && host !== 'arquivo' && !os.online()) title = offline();
      else title = render(host, path, query, url);
      t.title = title;
      addr.value = host === 'nova-aba' ? '' : url.startsWith('arquivo://') ? 'C:/' + (fs.pathString(fs.get(url.slice(10))?.parent || 'downloads')).slice(3).replace(/\\/g, '/') + '/' + (fs.get(url.slice(10))?.name || '') : url;
      addr.placeholder = 'Pesquise ou digite um endereço';
      const sec = $('.br-sec');
      const secure = SECURE.has(host);
      sec.innerHTML = host === 'nova-aba' ? lico('search', 15) : secure ? lico('lock', 14) : `${icon('warn', 15)}<span>Não seguro</span>`;
      sec.className = 'br-sec ' + (host === 'nova-aba' ? '' : secure ? 'ok' : 'bad');
      sec.title = secure ? 'A conexão é segura' : 'A conexão com este site não é segura';
      $('[data-a="back"]').disabled = t.hi <= 0;
      $('[data-a="fwd"]').disabled = t.hi >= t.hist.length - 1;
      ctx.setTitle(`${title} - Navegador`);
      renderTabs();
      if (emit) os.emit('browser:navigate', { url, host, path, secure, q: query.get('q') });
      if (emit && host === 'busca.com.br' && query.get('q')) os.emit('browser:search', { q: query.get('q') });
    }

    function link(url, text, cls = '', tut = '') { return `<a href="#" class="${cls}" data-go="${esc(url)}" ${tut ? `data-tut="${tut}"` : ''}>${text}</a>`; }
    function bindLinks() {
      page.querySelectorAll('[data-go]').forEach(a => { a.onclick = (e) => { e.preventDefault(); go(a.dataset.go); }; });
    }

    function offline() {
      page.innerHTML = `<div class="br-offline"><div class="br-dino">${lico('wifiOff', 64)}</div><h2>Você não está conectado</h2>
        <p>O computador está sem internet. Para conectar:</p><ol><li>Clique nos ícones de rede e som, no canto direito da barra de tarefas.</li><li>Clique na seta ao lado de Wi-Fi e escolha a sua rede.</li><li>Digite a senha do Wi-Fi.</li></ol>
        <button class="w-btn primary" data-retry>Tentar novamente</button></div>`;
      page.querySelector('[data-retry]').onclick = () => load(active, active.url);
      os.emit('browser:offline', {});
      return 'Sem conexão';
    }

    function render(host, path, q, url) {
      const P = page;
      switch (host) {
        case 'nova-aba':
          P.innerHTML = `<div class="br-newtab"><h1 class="br-logo">Buscador</h1><form class="br-search"><input placeholder="Pesquise na internet" data-tut="br-ntsearch"><button class="w-btn primary">Pesquisar</button></form>
            <div class="br-tiles">${FAVS.map(([u, n]) => `<button data-go="${u}">${lico('globe', 24)}<span>${esc(n)}</span></button>`).join('')}</div></div>`;
          P.querySelector('form').onsubmit = (e) => { e.preventDefault(); go(P.querySelector('form input').value); };
          bindLinks();
          setTimeout(() => P.querySelector('form input')?.focus(), 40);
          return 'Nova guia';
        case 'busca.com.br': {
          const term = q.get('q') || '';
          if (!term) {
            P.innerHTML = `<div class="br-newtab"><h1 class="br-logo">Buscador</h1><form class="br-search"><input placeholder="O que você quer saber?" data-tut="br-search"><button class="w-btn primary">Pesquisar</button></form><p class="w-muted">Dica: digite uma pergunta, como "receita de bolo de cenoura".</p></div>`;
            P.querySelector('form').onsubmit = (e) => { e.preventDefault(); go(P.querySelector('form input').value); };
            return 'Buscador';
          }
          const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const words = norm(term).split(/\s+/).filter(w => w.length > 2);
          let hits = INDEX.map(it => ({ it, s: words.filter(w => norm(it.kw + ' ' + it.title).includes(w)).length })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.it);
          const ad = /banco|premio|prêmio|dinheiro|pix|ganhar/.test(norm(term)) ? `<div class="br-res ad"><small>Patrocinado · meubanco-premiado.xyz/ganhe</small>${link('meubanco-premiado.xyz/ganhe', 'Meu Banco: Resgate seu prêmio de R$ 5.000 HOJE!', 'br-rt', 'res-phish')}<p>Clientes selecionados ganharam um prêmio. Confirme seus dados agora antes que expire!!!</p></div>` : '';
          if (!hits.length) hits = INDEX.slice(2, 5);
          P.innerHTML = `<div class="br-serp"><form class="br-search sm"><span class="br-logo sm">Buscador</span><input value="${esc(term)}"><button class="w-btn primary">Pesquisar</button></form>
            <p class="w-muted">Cerca de ${(hits.length * 1234567).toLocaleString('pt-BR')} resultados</p>${ad}
            ${hits.map((h, i) => `<div class="br-res"><small>${esc(h.url.split('/')[0])}</small>${link(h.url, esc(h.title), 'br-rt', i === 0 ? 'res-first' : '')}<p>${esc(h.desc)}</p></div>`).join('')}</div>`;
          P.querySelector('form').onsubmit = (e) => { e.preventDefault(); go(P.querySelector('form input').value); };
          bindLinks();
          return `${term} - Buscador`;
        }
        case 'receitas.com.br':
          if (path.startsWith('/bolo-de-cenoura')) {
            P.innerHTML = `<article class="br-site rec"><header>${link('receitas.com.br', '<b>Receitas</b>')}</header><h1>Bolo de cenoura com cobertura de chocolate</h1>
              <p class="w-muted">Rende 12 fatias · 50 minutos · fácil</p><div class="rec-img"></div>
              <h3>Ingredientes</h3><ul><li>3 cenouras médias</li><li>4 ovos</li><li>1 xícara de óleo</li><li>2 xícaras de açúcar</li><li>2 xícaras de farinha de trigo</li><li>1 colher (sopa) de fermento</li></ul>
              <h3>Modo de preparo</h3><ol><li>Bata no liquidificador as cenouras, os ovos e o óleo.</li><li>Misture com o açúcar e a farinha. Por último, o fermento.</li><li>Asse em forno médio (180 °C) por 40 minutos.</li></ol>
              <button class="w-btn primary" data-dl data-tut="dl-recipe">${lico('download', 16)} Baixar receita em PDF</button></article>`;
            P.querySelector('[data-dl]').onclick = () => download('Receita bolo de cenoura.pdf', 'Bolo de cenoura com cobertura de chocolate\n\nIngredientes:\n- 3 cenouras médias\n- 4 ovos\n- 1 xícara de óleo\n- 2 xícaras de açúcar\n- 2 xícaras de farinha de trigo\n- 1 colher (sopa) de fermento\n\nModo de preparo:\n1. Bata no liquidificador as cenouras, os ovos e o óleo.\n2. Misture com o açúcar e a farinha. Por último, o fermento.\n3. Asse em forno médio (180 °C) por 40 minutos.');
            bindLinks();
            return 'Bolo de cenoura - Receitas';
          }
          P.innerHTML = `<article class="br-site rec"><header><b>Receitas</b></header><h1>Receitas da semana</h1>
            <div class="rec-grid">${link('receitas.com.br/bolo-de-cenoura', '<div class="rec-img"></div><b>Bolo de cenoura</b>', 'rec-card', 'rec-bolo')}<div class="rec-card"><div class="rec-img b"></div><b>Pão de queijo</b></div><div class="rec-card"><div class="rec-img c"></div><b>Feijoada</b></div></div></article>`;
          bindLinks();
          return 'Receitas';
        case 'noticias.com.br':
          P.innerHTML = `<article class="br-site news"><header><b>Notícias</b><span>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></header>
            <h1>Golpes pelo celular crescem: veja como se proteger</h1><p>Especialistas recomendam desconfiar de mensagens com prêmios e urgência, conferir sempre o endereço do site e nunca informar senhas por telefone ou mensagem.</p>
            <div class="news-grid"><div><h3>Tecnologia</h3><p>Computadores com SSD ligam até 5 vezes mais rápido que os com HD, mostra teste.</p></div><div><h3>Economia</h3><p>Preço do café sobe pelo terceiro mês seguido.</p></div><div><h3>Esportes</h3><p>Seleção vence amistoso por 2 a 0.</p></div></div></article>`;
          return 'Notícias';
        case 'clima.com.br':
          P.innerHTML = `<article class="br-site clima"><h1>Previsão do tempo</h1><div class="clima-now">${lico('sun', 64)}<div><b>27 °C</b><span>Ensolarado, poucas nuvens</span></div></div>
            <div class="clima-week">${['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d, i) => `<div><b>${d}</b>${lico(i === 2 ? 'moon' : 'sun', 28)}<span>${28 - i} °C</span></div>`).join('')}</div></article>`;
          return 'Clima';
        case 'meubanco.com.br':
          P.innerHTML = `<article class="br-site bank"><header><b>Meu Banco</b></header><div class="bank-box"><h2>Acesse sua conta</h2>
            <form class="bank-form"><label>Agência<input class="w-input" placeholder="0000"></label><label>Conta<input class="w-input" placeholder="00000-0"></label><label>Senha<input class="w-input" type="password" placeholder="Senha de 6 dígitos"></label><button class="w-btn primary">Entrar</button></form>
            <p class="bank-tip">${lico('shield', 16)} Confira: o endereço é <b>meubanco.com.br</b> e há um cadeado ao lado dele.</p></div></article>`;
          P.querySelector('form').onsubmit = (e) => {
            e.preventDefault();
            os.emit('browser:login', { site: 'real' });
            os.dialog({ title: 'Simulação', icon: 'info', message: 'Este era o site verdadeiro do banco: endereço certo e cadeado.\n\nMesmo assim, num computador de verdade, só digite sua senha depois de conferir essas duas coisas. E nunca use as senhas reais aqui no simulador.' });
          };
          return 'Meu Banco - Acesse sua conta';
        case 'meubanco-premiado.xyz':
          P.className = 'br-page phish';
          P.innerHTML = `<article class="br-site phishing"><div class="ph-flash">PARABÉNS!!! VOCÊ FOI SORTEADO</div><h1>Você ganhou R$ 5.000,00 do Meu Banco</h1>
            <p class="ph-timer">Oferta expira em <b>04:59</b>. Confirme agora para não perder!</p>
            <form class="bank-form"><label>CPF<input class="w-input" data-tut="phish-cpf"></label><label>Senha do banco<input class="w-input" type="password"></label><label>Número do cartão<input class="w-input"></label><button class="w-btn danger">RESGATAR MEU PRÊMIO</button></form>
            <button class="w-btn" data-leave data-tut="phish-leave">Sair deste site</button></article>`;
          P.querySelector('form').onsubmit = (e) => { e.preventDefault(); phishCaught(); };
          P.querySelector('[data-leave]').onclick = () => { os.emit('browser:phish', { action: 'leave' }); go('busca.com.br'); };
          os.emit('browser:phish', { action: 'visit' });
          return 'PARABÉNS!!! Prêmio';
        case 'loja.com.br': {
          const cart = store('cart');
          P.innerHTML = `<article class="br-site shop"><header><b>Loja</b><button class="w-btn sm" data-cart>${lico('cart', 16)} Carrinho (${cart.length})</button></header>
            <div class="shop-grid">${[['Fone de ouvido Bluetooth', 149], ['Mouse sem fio', 59], ['Teclado', 89], ['Pendrive 64 GB', 39]].map(([n, p]) => `<div class="shop-card"><div class="shop-img"></div><b>${n}</b><span>R$ ${p},00</span><button class="w-btn sm primary" data-add="${n}">Adicionar ao carrinho</button></div>`).join('')}</div>
            <div class="shop-cart" hidden><h3>Seu carrinho</h3><ul>${cart.map(c => `<li>${esc(c)}</li>`).join('') || '<li>Vazio</li>'}</ul><button class="w-btn primary" data-pay>Finalizar compra</button></div></article>`;
          P.querySelectorAll('[data-add]').forEach(b => { b.onclick = () => { cart.push(b.dataset.add); saveStore('cart', cart); os.emit('browser:cart', { item: b.dataset.add }); load(active, active.url, false); }; });
          P.querySelector('[data-cart]').onclick = () => { P.querySelector('.shop-cart').hidden = false; };
          P.querySelector('[data-pay]').onclick = () => os.dialog({ title: 'Compra segura', icon: 'info', message: 'Antes de pagar, confira: endereço da loja correto, cadeado ao lado do endereço e se a loja é conhecida. Prefira cartão de crédito virtual em compras online.\n\n(No simulador nenhuma compra é feita.)' });
          return 'Loja - Ofertas';
        }
        case 'videos.com.br':
          P.innerHTML = `<article class="br-site vids"><div class="vid-player" data-tut="vid-player"><button class="vid-play">${lico('play', 40)}</button><div class="vid-bar"><i></i></div></div><h2>Gatinho aprendendo a usar o computador</h2><p class="w-muted">1,2 mi de visualizações</p></article>`;
          P.querySelector('.vid-play').onclick = (e) => { e.currentTarget.parentElement.classList.toggle('on'); os.emit('browser:video', {}); };
          return 'Vídeos';
        case 'enciclopedia.org':
          P.innerHTML = `<article class="br-site wiki"><h1>Computador</h1><p><b>Computador</b> é uma máquina que recebe informações, faz cálculos com elas e mostra o resultado. Ele é formado por <b>hardware</b> (as peças físicas, como processador, memória e disco) e <b>software</b> (os programas, como o Windows e o navegador).</p>
            <h3>Principais partes</h3><ul><li><b>Processador:</b> faz as contas.</li><li><b>Memória RAM:</b> guarda o que está aberto agora.</li><li><b>Armazenamento:</b> guarda os arquivos mesmo desligado.</li><li><b>Placa de vídeo:</b> desenha as imagens na tela.</li></ul>
            <h3>História</h3><p>Os primeiros computadores, nos anos 1940, ocupavam salas inteiras. Hoje, um celular é milhares de vezes mais poderoso que eles.</p></article>`;
          return 'Computador - Enciclopédia';
        case 'programas-gratis.net':
          P.className = 'br-page phish';
          P.innerHTML = `<article class="br-site fakedl"><h1>Baixar Campo Minado GRÁTIS</h1><div class="fd-ads"><button class="fd-ad" data-fake>⬇ DOWNLOAD AGORA</button><button class="fd-ad g" data-fake>BAIXAR (RÁPIDO)</button><button class="fd-ad o" data-fake>INICIAR DOWNLOAD</button></div>
            <p class="fd-small">Link oficial: <a href="#" data-real>baixar pela Loja do Windows</a></p></article>`;
          P.querySelectorAll('[data-fake]').forEach(b => { b.onclick = () => { os.emit('browser:fakeDownload', {}); os.dialog({ title: 'Cuidado!', icon: 'warn', message: 'Esses botões grandes e coloridos são propaganda e podem baixar vírus.\n\nPrefira instalar programas pela Loja ou pelo site oficial do fabricante.' }); }; });
          P.querySelector('[data-real]').onclick = (e) => { e.preventDefault(); os.openApp('store'); };
          return 'Baixar programas grátis!!!';
        case 'arquivo': {
          const n = fs.get(url.slice(10));
          P.className = 'br-page pdf';
          P.innerHTML = n ? `<div class="pdf-sheet"><pre>${esc(n.content || '')}</pre></div>` : '<p class="w-muted">Arquivo não encontrado.</p>';
          return n ? n.name : 'Arquivo';
        }
        default:
          P.innerHTML = `<div class="br-offline"><h2>Hmm... não é possível acessar esta página</h2><p>Verifique se o endereço <b>${esc(host)}</b> está digitado corretamente.</p><p>No simulador só existem alguns sites. Experimente o ${link('busca.com.br', 'Buscador')}.</p></div>`;
          bindLinks();
          os.emit('browser:notfound', { host });
          return 'Não é possível acessar';
      }
    }

    function phishCaught() {
      os.emit('browser:phish', { action: 'submit' });
      os.dialog({
        title: 'Isso era um golpe!', icon: 'error', width: 520,
        html: `<p><b>Calma: aqui é só um treino.</b> Na vida real, quem enviou seus dados agora estaria nas mãos de golpistas.</p>
          <p>Os sinais de que o site era falso:</p><ul><li>O endereço não era <b>meubanco.com.br</b>, era <b>meubanco-premiado.xyz</b>.</li><li>Aparecia "Não seguro" no lugar do cadeado.</li><li>Prêmio inesperado e pressa ("expira em 5 minutos").</li><li>Pedia senha e número do cartão de uma vez.</li></ul>
          <p>Bancos nunca pedem sua senha por link, e-mail ou mensagem.</p>`,
      });
    }

    function download(name, content) {
      const node = fs.create(SPECIAL.DOWNLOADS, name, 'file', { content });
      const D = $('.br-dl');
      D.innerHTML = `${icon('pdf', 26)}<span><b>${esc(node.name)}</b><small>Download concluído · salvo em Downloads</small></span><button class="w-btn sm" data-open data-tut="dl-open">Abrir arquivo</button><button class="w-btn sm" data-folder data-tut="dl-folder">Mostrar na pasta</button><button class="w-ib sm" data-x>${lico('close', 14)}</button>`;
      D.hidden = false;
      D.querySelector('[data-open]').onclick = () => { newTab('arquivo://' + node.id); };
      D.querySelector('[data-folder]').onclick = () => os.openApp('explorer', { folder: SPECIAL.DOWNLOADS });
      D.querySelector('[data-x]').onclick = () => { D.hidden = true; };
      os.emit('browser:download', { node });
      os.emit('fs:create', { node, parent: SPECIAL.DOWNLOADS });
    }

    function store(k) { try { return JSON.parse(sessionStorage.getItem('br:' + k)) || []; } catch { return []; } }
    function saveStore(k, v) { try { sessionStorage.setItem('br:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } }

    $('[data-newtab]').onclick = () => { newTab(); os.emit('browser:newtab', { count: tabs.length }); };
    $('[data-a="back"]').onclick = () => { if (active.hi > 0) { active.hi--; load(active, active.hist[active.hi]); } };
    $('[data-a="fwd"]').onclick = () => { if (active.hi < active.hist.length - 1) { active.hi++; load(active, active.hist[active.hi]); } };
    $('[data-a="reload"]').onclick = () => load(active, active.url);
    $('[data-a="home"]').onclick = () => go('busca.com.br');
    $('[data-a="dls"]').onclick = () => os.openApp('explorer', { folder: SPECIAL.DOWNLOADS });
    addr.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { go(addr.value); addr.blur(); } });
    addr.addEventListener('focus', () => addr.select());
    body.querySelectorAll('[data-fav]').forEach(b => { b.onclick = () => go(b.dataset.fav); });

    newTab(args.url || 'busca.com.br');
    return {
      onArgs(a) { if (a.url) newTab(a.url); },
      onKey(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 't') { newTab(); os.emit('browser:newtab', { count: tabs.length }); return true; }
        if (e.ctrlKey && e.key.toLowerCase() === 'w') { closeTab(active); return true; }
        return false;
      },
      currentUrl: () => active?.url,
    };
  },
};
