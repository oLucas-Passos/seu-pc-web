// Motor de desempenho: compatibilidade, energia, temperatura, notas e FPS.
// Tudo é estimativa educativa, calibrada com resultados públicos de testes.
import { GAMES, APPS } from './apps-data.js';
import { SOCKET_RAM } from './catalog.js';
import { fmtNum } from '../ui.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LN_GAME = Math.log(1 + 450 / 8);
const L = x => Math.log(1 + 9 * Math.max(0, x)) / Math.log(10);

/* ---------------- Fórmulas para peças personalizadas ---------------- */

// Processador: desempenho de 1 núcleo ≈ frequência × eficiência da geração (ano).
export function cpuFormula(s) {
  const year = clamp(Number(s.year) || 2020, 1990, 2040);
  const ipc = Math.max(3, 10 + (year - 2010));
  const st = (Number(s.boostGHz) || 1) * ipc;
  const cores = Math.max(1, Number(s.cores) || 1);
  const threads = Math.max(cores, Number(s.threads) || cores);
  const eff = cores + (threads - cores) * 0.25;
  const mt = st * Math.pow(eff, 0.9) * 0.1075;
  return { st, mt };
}

// Placa de vídeo: TFLOPS × eficiência da arquitetura (marca + ano), com retorno decrescente.
export function gpuArch(brand, year) {
  const y = Number(year) || 2020;
  if (brand === 'NVIDIA') return y <= 2015 ? 0.55 : y <= 2017 ? 0.65 : y <= 2019 ? 0.71 : y <= 2021 ? 0.55 : y <= 2024 ? 0.6 : 0.62;
  if (brand === 'AMD') return y <= 2018 ? 0.4 : y <= 2021 ? 0.85 : y <= 2024 ? 0.78 : 1.2;
  if (brand === 'Intel') return 0.71;
  return 0.7;
}
export function gpuFormula(s, brand, year) {
  const tflops = (Number(s.cores) || 1) * 2 * ((Number(s.boostMHz) || 1000) / 1000) / 1000;
  const eff = tflops * gpuArch(brand, year);
  return 100 * Math.pow(Math.max(eff, 0.01) / 9.06, 0.7);
}

// Para peças baseadas num modelo do catálogo: mantém a nota do modelo e escala pela mudança nas especificações.
export function deriveCustomScores(part, template) {
  const s = part.specs;
  if (part.cat === 'cpu') {
    const mine = cpuFormula({ ...s, year: part.year });
    if (template && template.cat === 'cpu') {
      const base = cpuFormula({ ...template.specs, year: template.year });
      s.st = template.specs.st * mine.st / base.st;
      s.mt = template.specs.mt * mine.mt / base.mt;
    } else {
      s.st = mine.st; s.mt = mine.mt;
    }
    s.st = round1(s.st); s.mt = round1(s.mt);
  } else if (part.cat === 'gpu') {
    const mine = gpuFormula(s, s.chip || part.brand, part.year);
    if (template && template.cat === 'gpu') {
      const base = gpuFormula(template.specs, template.specs.chip || template.brand, template.year);
      s.idx = template.specs.idx * mine / base;
    } else {
      s.idx = mine;
    }
    s.idx = round1(s.idx);
  }
  return part;
}
const round1 = v => Math.round(v * 10) / 10;

/* ---------------- Análise do PC ---------------- */

// build: { case, psu, mobo, cpu, cooler, gpu, ram: [], storage: [], fans: [], paste, cables, loose }
export function analyze(build) {
  const b = normalize(build);
  const issues = [];
  const missing = [];
  for (const k of ['case', 'psu', 'mobo', 'cpu', 'cooler']) if (!b[k]) missing.push(k);
  if (!b.ram.length) missing.push('ram');
  if (!b.storage.length) missing.push('storage');

  /* ---- Compatibilidade ---- */
  const mobo = b.mobo?.specs, cpu = b.cpu?.specs, cas = b.case?.specs;
  if (mobo && cpu && mobo.socket !== cpu.socket) {
    issues.push({ level: 'bad', title: 'Processador não encaixa na placa-mãe', text: `O processador usa soquete ${cpu.socket} e a placa-mãe é ${mobo.socket}. Eles precisam ser iguais.` });
  }
  if (mobo && b.ram.some(r => r.specs.type !== mobo.ramType)) {
    issues.push({ level: 'bad', title: 'Memória de tipo errado', text: `A placa-mãe usa ${mobo.ramType}. Pentes de outro tipo nem encaixam (o chanfro fica em outro lugar).` });
  }
  if (cas && mobo && !cas.forms.includes(mobo.form)) {
    issues.push({ level: 'bad', title: 'Placa-mãe grande demais para o gabinete', text: `O gabinete aceita ${cas.forms.join(', ')} e a placa-mãe é ${mobo.form}.` });
  }
  if (cas && b.gpu && b.gpu.specs.lengthCM > cas.maxGpu) {
    issues.push({ level: 'bad', title: 'Placa de vídeo não cabe', text: `Ela tem ${b.gpu.specs.lengthCM} cm e o gabinete aceita até ${cas.maxGpu} cm.` });
  }
  if (cas && b.cooler && b.cooler.specs.kind !== 'aio' && b.cooler.specs.heightCM > cas.maxCooler) {
    issues.push({ level: 'bad', title: 'Cooler alto demais', text: `O cooler tem ${b.cooler.specs.heightCM} cm e o gabinete aceita até ${cas.maxCooler} cm. A tampa não fecharia.` });
  }
  if (cas && b.cooler && b.cooler.specs.kind === 'aio' && !cas.radiators.includes(b.cooler.specs.radiator)) {
    issues.push({ level: 'bad', title: 'Radiador não cabe', text: `O gabinete não tem espaço para radiador de ${b.cooler.specs.radiator} mm.` });
  }
  if (mobo && cpu && SOCKET_RAM[cpu.socket] && !SOCKET_RAM[cpu.socket].includes(mobo.ramType)) {
    issues.push({ level: 'bad', title: 'Memória não suportada pelo processador', text: `Este processador não trabalha com ${mobo.ramType}.` });
  }

  /* ---- Memória ---- */
  const ramGB = b.ram.reduce((t, r) => t + r.specs.gb, 0);
  const sticks = b.ram.length;
  const dual = sticks >= 2;
  const ramMHzRaw = sticks ? Math.min(...b.ram.map(r => r.specs.mhz)) : 0;
  const ramMHz = mobo ? Math.min(ramMHzRaw, mobo.maxRamSpeed || ramMHzRaw) : ramMHzRaw;
  const ramType = b.ram[0]?.specs.type || mobo?.ramType || '';
  if (mobo && ramGB > mobo.maxRam) issues.push({ level: 'warn', title: 'Memória acima do limite da placa', text: `A placa-mãe só reconhece até ${mobo.maxRam} GB.` });
  if (sticks === 1) issues.push({ level: 'warn', title: 'Só um pente de memória', text: 'Com dois pentes iguais a memória trabalha em "dual channel" e fica até 15% mais rápida (e o vídeo integrado, até 50%).' });
  if (sticks && ramMHzRaw > ramMHz) issues.push({ level: 'info', title: 'Memória rodando abaixo da velocidade', text: `A placa-mãe limita a memória a ${ramMHz} MHz.` });
  const ramFactor = sticks ? (dual ? 1 : 0.88) * Math.pow(Math.max(ramMHz, 800) / 3200, 0.1) : 0;

  /* ---- Refrigeração ---- */
  const fanCount = (cas?.fansIncluded || 0) + b.fans.length;
  const airflow = fanCount === 0 ? 0.85 : fanCount === 1 ? 0.93 : fanCount === 2 ? 0.97 : fanCount >= 5 ? 1.03 : 1;
  let cpuThermal = 1;
  if (cpu) {
    if (!b.cooler) cpuThermal = 0;
    else {
      const cap = b.cooler.specs.capacity * airflow * (b.paste ? 1 : 0.6);
      cpuThermal = clamp(Math.pow(cap / cpu.tdpMax, 0.5), 0.45, 1);
    }
  }
  if (b.cooler && !b.paste) issues.push({ level: 'warn', title: 'Sem pasta térmica', text: 'Sem a pasta, o calor não passa direito do processador para o cooler. Ele esquenta e perde desempenho.' });
  if (cpu && b.cooler && cpuThermal < 0.97) {
    issues.push({ level: 'warn', title: 'Cooler fraco para este processador', text: `O processador chega a ${cpu.tdpMax} W e esquenta demais. Ele reduz a velocidade para não queimar (perde ~${Math.round((1 - cpuThermal) * 100)}%).` });
  }
  if (b.case && fanCount === 0) issues.push({ level: 'warn', title: 'Nenhuma ventoinha no gabinete', text: 'O ar quente fica preso dentro do gabinete. Adicione ao menos uma ventoinha atrás e uma na frente.' });

  /* ---- Processador ---- */
  let cpuR = { st: 0, mt: 0, game: 0, threads: 0, cores: 0 };
  if (cpu) {
    const coreFactor = Math.pow(Math.min(1, cpu.threads / 12), 0.4);
    const t = cpuThermal || 0;
    const st = cpu.st * (0.85 + 0.15 * t) * (t ? 1 : 0);
    const mt = cpu.mt * t;
    cpuR = {
      st, mt, threads: cpu.threads, cores: cpu.cores,
      game: st * coreFactor * (cpu.x3d ? 1.15 : 1) * (ramFactor || 0.5),
    };
  }

  /* ---- Vídeo ---- */
  let gpuR = { eff: 0, vram: 0, rt: false, integrated: false, name: 'Sem vídeo' };
  const gpuThermal = Math.min(1, airflow + 0.02);
  if (b.gpu) {
    gpuR = { eff: b.gpu.specs.idx * gpuThermal, vram: b.gpu.specs.vram, rt: !!b.gpu.specs.rt, integrated: false, name: b.gpu.name };
  } else if (cpu && cpu.igpu) {
    const speed = Math.pow(Math.max(ramMHz || 1600, 800) / 4800, 0.35);
    gpuR = {
      eff: cpu.igpu * (dual ? 1 : 0.65) * speed,
      vram: ramGB >= 16 ? 4 : ramGB >= 8 ? 2 : 1,
      rt: cpu.igpu >= 25, integrated: true, name: cpu.igpuName || 'Vídeo integrado',
    };
    if (cpu.igpu < 10) issues.push({ level: 'info', title: 'Usando o vídeo do processador', text: 'Dá para usar o computador, ver vídeos e jogar coisas bem leves. Para jogos atuais, adicione uma placa de vídeo.' });
  } else if (cpu) {
    issues.push({ level: 'bad', title: 'Sem saída de vídeo', text: 'Este processador não tem vídeo integrado e não há placa de vídeo: a tela vai ficar preta.' });
  }

  /* ---- Armazenamento ---- */
  const storageGB = b.storage.reduce((t, s) => t + s.specs.gb, 0);
  const kinds = b.storage.map(s => s.specs.kind === 'nvme' ? 'nvme' + (s.specs.gen || 3) : s.specs.kind);
  const kindFactor = { hdd: 0.35, sata: 0.85, nvme3: 0.95, nvme4: 1, nvme5: 1.02 };
  const storageFactor = kinds.length ? Math.max(...kinds.map(k => kindFactor[k] || 0.9)) : 0;
  const hasSSD = kinds.some(k => k !== 'hdd');
  if (b.storage.length && !hasSSD) issues.push({ level: 'warn', title: 'Só HD mecânico', text: 'O Windows vai demorar para ligar e os programas para abrir. Um SSD é o upgrade que mais faz diferença no dia a dia.' });
  const m2Count = b.storage.filter(s => s.specs.form === 'm2').length;
  if (mobo && m2Count > mobo.m2Slots) issues.push({ level: 'bad', title: 'Faltam entradas M.2', text: `A placa-mãe tem ${mobo.m2Slots} entrada(s) M.2 e você tem ${m2Count} SSD(s) M.2.` });

  /* ---- Energia ---- */
  const load = Math.round((cpu?.tdpMax || 0) + (b.gpu?.specs.tdp || 0) + (b.mobo ? 30 : 0) + sticks * 4
    + b.storage.reduce((t, s) => t + (s.specs.kind === 'hdd' ? 8 : s.specs.kind === 'nvme' ? 6 : 3), 0)
    + fanCount * 3 + (b.cooler?.specs.kind === 'aio' ? 6 : 0));
  const idle = Math.round(load * 0.3 + 20);
  const psuReal = b.psu?.specs.realWatts || 0;
  const recommended = Math.max(400, Math.ceil(load * 1.35 / 50) * 50);
  const power = { load, idle, psu: b.psu?.specs.watts || 0, psuReal, recommended, ok: !b.psu || load <= psuReal };
  if (b.psu && load > psuReal) {
    issues.push({ level: 'bad', title: 'Fonte fraca demais', text: `O PC pode consumir até ${load} W, mas a fonte entrega ${psuReal} W com segurança. Ele vai desligar sozinho em jogos. Use uma fonte de ${recommended} W ou mais.` });
  } else if (b.psu && load > psuReal * 0.85) {
    issues.push({ level: 'warn', title: 'Fonte no limite', text: `A fonte vai trabalhar perto do máximo (${load} de ${psuReal} W). Recomendado: ${recommended} W.` });
  }
  if (b.psu && b.psu.specs.rating === 'Sem selo') issues.push({ level: 'warn', title: 'Fonte genérica', text: 'Fontes sem selo de eficiência costumam entregar menos do que prometem e podem danificar as peças.' });
  if (b.gpu?.specs.power === '16' && b.psu && !b.psu.specs.atx3) issues.push({ level: 'info', title: 'Precisa de adaptador', text: 'A placa de vídeo usa o conector novo de 16 pinos. Esta fonte não tem esse cabo, então será usado o adaptador que vem com a placa.' });

  /* ---- Notas ---- */
  const G = Math.min(gpuR.eff, cpuR.game * 2.2);
  const rawGames = 100 * Math.log(1 + G / 8) / LN_GAME;
  const rawWork = 100 * (0.55 * L(cpuR.mt / 240) + 0.3 * L(gpuR.eff / 400) + 0.15 * Math.min(1.2, ramGB / 64));
  const rawDaily = 100 * (0.45 * Math.pow(Math.min(1, cpuR.st / 110), 0.7) + 0.25 * Math.pow(Math.min(1, ramGB / 16), 0.8) + 0.30 * Math.min(1, storageFactor))
    * (ramGB && ramGB < 8 ? 0.75 : 1);
  const rawMulti = 100 * (0.55 * Math.pow(Math.min(1, ramGB / 32), 0.7) + 0.45 * Math.pow(Math.min(1, (cpuR.threads || 0) / 16), 0.7));
  const working = cpu && b.mobo && sticks && (gpuR.eff > 0);
  const scores = working ? {
    games: rawGames, work: rawWork, daily: rawDaily, multi: rawMulti,
  } : { games: 0, work: 0, daily: 0, multi: 0 };
  scores.overall = 0.4 * scores.games + 0.25 * scores.work + 0.2 * scores.daily + 0.15 * scores.multi;
  const display = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, clamp(Math.round(v), 0, 100)]));
  const beyond = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v > 100]));

  /* ---- Gargalo ---- */
  let bottleneck = null;
  if (working && b.gpu) {
    const cpuCap = cpuR.game * 2.2;
    if (cpuCap < gpuR.eff * 0.7) bottleneck = { part: 'cpu', text: `O processador está segurando a placa de vídeo (gargalo). Nos jogos, a placa fica esperando o processador e entrega só ~${Math.round(cpuCap / gpuR.eff * 100)}% do que poderia.` };
    else if (gpuR.eff < cpuCap * 0.35) bottleneck = { part: 'gpu', text: 'A placa de vídeo é bem mais fraca que o processador. Para jogos, ela é a primeira peça a trocar.' };
  } else if (working && gpuR.integrated && cpuR.game > 40) {
    bottleneck = { part: 'gpu', text: 'O vídeo integrado limita os jogos. Uma placa de vídeo faria o PC render muito mais.' };
  }
  if (working && ramGB < 8) issues.push({ level: 'warn', title: 'Pouca memória RAM', text: `Com ${ramGB} GB o Windows e o navegador já ficam travando. O mínimo confortável hoje é 16 GB.` });

  const price = ['case', 'psu', 'mobo', 'cpu', 'cooler', 'gpu'].reduce((t, k) => t + (b[k]?.price || 0), 0)
    + [...b.ram, ...b.storage, ...b.fans].reduce((t, p) => t + (p.price || 0), 0);

  return {
    build: b, missing, issues, power, price, working: !!working,
    cpu: cpuR, gpu: gpuR, cpuThermal, airflow, fanCount,
    ram: { gb: ramGB, sticks, dual, mhz: ramMHz, type: ramType },
    storage: { gb: storageGB, hasSSD, factor: storageFactor, kinds },
    scores: display, raw: scores, beyond, bottleneck, tier: tierFor(display, working),
  };
}

function normalize(b) {
  return {
    case: b.case || null, psu: b.psu || null, mobo: b.mobo || null, cpu: b.cpu || null,
    cooler: b.cooler || null, gpu: b.gpu || null,
    ram: b.ram || [], storage: b.storage || [], fans: b.fans || [],
    paste: b.paste !== false, cables: b.cables || null, loose: b.loose || 0,
  };
}

function tierFor(s, working) {
  if (!working) return { label: 'Incompleto', text: 'Faltam peças essenciais para o PC funcionar.' };
  if (s.games >= 88) return { label: 'Monstro', text: 'Roda qualquer jogo no máximo, inclusive em 4K, e encara trabalho profissional pesado.' };
  if (s.games >= 76) return { label: 'Gamer avançado', text: 'Jogos atuais no alto ou ultra em 1080p e 1440p com folga.' };
  if (s.games >= 62) return { label: 'Gamer intermediário', text: 'Roda os jogos atuais em 1080p no alto ou médio.' };
  if (s.games >= 45) return { label: 'Gamer de entrada', text: 'Jogos competitivos rodam bem; jogos pesados no baixo ou médio.' };
  if (s.daily >= 70) return { label: 'Ótimo para estudo e trabalho', text: 'Rápido no dia a dia. Jogos só os mais leves.' };
  if (s.daily >= 45) return { label: 'Básico', text: 'Dá conta de navegar, ver vídeos e usar o Office, com um pouco de paciência.' };
  return { label: 'Muito fraco', text: 'Vai sofrer até com tarefas simples nos dias de hoje.' };
}

/* ---------------- Jogos e programas ---------------- */

const PRESETS = [
  { id: 'low', label: 'Baixo', g: 0.5, c: 0.85, v: 0.6 },
  { id: 'medium', label: 'Médio', g: 0.7, c: 0.92, v: 0.8 },
  { id: 'high', label: 'Alto', g: 1, c: 1, v: 1 },
  { id: 'ultra', label: 'Ultra', g: 1.4, c: 1.06, v: 1.3 },
];
export const RESOLUTIONS = [
  { id: 1080, label: '1080p (Full HD)', g: 1, v: 1 },
  { id: 1440, label: '1440p (2K)', g: 1.65, v: 1.12 },
  { id: 2160, label: '4K', g: 3.2, v: 1.3 },
];

export function gameResult(game, a, resId = 1080) {
  const res = RESOLUTIONS.find(r => r.id === resId) || RESOLUTIONS[0];
  const out = { id: game.id, name: game.name, color: game.color, kind: 'game', fps: {}, notes: [] };
  if (!a.working) return { ...out, status: 'no', reason: 'O PC ainda não está completo.' };
  if (game.rtRequired && !a.gpu.rt) return { ...out, status: 'no', reason: 'Exige placa de vídeo com Ray Tracing (ex.: RTX 2060, RX 6600 ou mais nova).' };
  if (a.ram.gb < game.ram * 0.5) return { ...out, status: 'no', reason: `Precisa de pelo menos ${game.ram} GB de memória RAM.` };
  if (game.minThreads && a.cpu.threads < game.minThreads) return { ...out, status: 'no', reason: `O jogo não abre em processadores com menos de ${game.minThreads} threads.` };

  for (const p of PRESETS) {
    const gpuNeed = game.gpu60 * p.g * res.g;
    let fps = Math.min(
      60 * Math.pow(Math.max(a.gpu.eff, 0.01) / gpuNeed, 0.9),
      60 * a.cpu.game / (game.cpu60 * p.c),
      game.cap || 999,
    );
    const vramNeed = game.vram * p.v * res.v;
    if (a.gpu.vram < vramNeed) fps *= Math.max(0.35, Math.pow(a.gpu.vram / vramNeed, 1.5));
    if (a.ram.gb < game.ramRec) fps *= a.ram.gb >= game.ram ? 0.88 : 0.5;
    if (game.ssd && !a.storage.hasSSD) fps *= 0.9;
    if (game.dx12u && !a.gpu.rt) fps *= 0.4;
    out.fps[p.id] = Math.max(0, Math.round(fps));
  }

  if (a.gpu.vram < game.vram) out.notes.push(`Pouca memória de vídeo: o jogo pede ${game.vram} GB no alto.`);
  if (a.ram.gb < game.ramRec) out.notes.push(`Recomendado ${game.ramRec} GB de RAM.`);
  if (game.ssd && !a.storage.hasSSD) out.notes.push('Precisa de SSD: no HD vai demorar a carregar e travar.');
  if (game.dx12u && !a.gpu.rt) out.notes.push('Exige DirectX 12 Ultimate: roda muito mal em placas antigas.');
  if (a.storage.gb && a.storage.gb - 64 < game.size) out.notes.push(`Ocupa ${game.size} GB: pouco espaço livre.`);

  const f = out.fps;
  const cap = game.cap || 999;
  const smooth = Math.min(60, cap * 0.95);
  if (f.low < Math.min(24, cap * 0.8)) out.status = 'no';
  else if (f.ultra >= smooth) out.status = 'max';
  else if (f.high >= Math.min(50, cap * 0.85) || f.medium >= smooth) out.status = 'good';
  else out.status = 'min';

  const best = [...PRESETS].reverse().find(p => f[p.id] >= Math.min(55, cap * 0.9));
  out.best = best ? best.label : null;
  out.summary = out.status === 'no'
    ? `~${f.low} FPS no Baixo: travando`
    : best ? `~${f[best.id]} FPS no ${best.label}` : `~${f.low} FPS no Baixo`;
  if (out.status === 'no' && !out.reason) out.reason = 'Fica abaixo de 24 quadros por segundo: injogável.';
  return out;
}

export function appResult(app, a) {
  const out = { id: app.id, name: app.name, color: app.color, kind: 'app', what: app.what, notes: [] };
  if (!a.working) return { ...out, status: 'no', reason: 'O PC ainda não está completo.' };
  const n = app.need;
  if (n.ramMin && a.ram.gb < n.ramMin) return { ...out, status: 'no', reason: `Precisa de pelo menos ${n.ramMin} GB de RAM.` };
  if (app.minThreads && a.cpu.threads < app.minThreads) return { ...out, status: 'no', reason: `Precisa de um processador com ${app.minThreads} threads ou mais.` };
  if (app.needsDiscrete && a.gpu.integrated) return { ...out, status: 'no', reason: 'Precisa de uma placa de vídeo dedicada.' };
  if (n.vramMin && a.gpu.vram < n.vramMin) return { ...out, status: 'no', reason: `Precisa de placa de vídeo com ${n.vramMin} GB de memória ou mais.` };
  if (app.win11) {
    const cpuYear = a.build.cpu?.year || 2020;
    if (cpuYear < 2018) {
      return { ...out, status: 'min', reason: 'Processador antigo demais para o Windows 11 oficial. Use o Windows 10 ou Linux.', summary: 'Não é suportado oficialmente' };
    }
    if (a.storage.gb && a.storage.gb < 64) return { ...out, status: 'no', reason: 'Precisa de 64 GB de espaço.' };
  }
  const parts = [];
  if (n.st) parts.push({ r: a.cpu.st / n.st, what: 'processador' });
  if (n.mt) parts.push({ r: a.cpu.mt / n.mt, what: 'processador (vários núcleos)' });
  if (n.gpu) parts.push({ r: a.gpu.eff / n.gpu, what: 'placa de vídeo' });
  if (n.ram) parts.push({ r: Math.pow(a.ram.gb / n.ram, 0.8), what: 'memória RAM' });
  let r = Math.min(...parts.map(p => p.r));
  const limiter = parts.find(p => p.r === r);
  if (n.ssd && !a.storage.hasSSD) { r *= 0.7; out.notes.push('Funciona bem melhor com SSD.'); }
  if (!a.storage.hasSSD) r *= 0.9;
  out.ratio = r;
  out.status = r >= 1.25 ? 'max' : r >= 0.85 ? 'good' : r >= 0.45 ? 'min' : 'no';
  out.summary = { max: 'Roda perfeitamente', good: 'Roda bem', min: 'Roda com lentidão', no: 'Não roda' }[out.status];
  if (out.status !== 'max' && limiter) out.reason = `Quem limita: ${limiter.what}.`;
  return out;
}

export function allResults(a, resId) {
  return {
    games: GAMES.map(g => gameResult(g, a, resId)),
    apps: APPS.map(app => ({ ...appResult(app, a), cat: app.cat })),
  };
}

export const STATUS = {
  max: { label: 'Roda no máximo', cls: 'ok' },
  good: { label: 'Roda bem', cls: 'accent' },
  min: { label: 'Roda no mínimo', cls: 'warn' },
  no: { label: 'Não roda', cls: 'bad' },
};
export const APP_STATUS = {
  max: { label: 'Roda perfeitamente', cls: 'ok' },
  good: { label: 'Roda bem', cls: 'accent' },
  min: { label: 'Roda com lentidão', cls: 'warn' },
  no: { label: 'Não roda', cls: 'bad' },
};

/* ---------------- Ao apertar o botão de ligar ---------------- */

export function bootCheck(b, a) {
  const cables = b.cables || {};
  const fail = (code, title, text, fix) => ({ ok: false, code, title, text, fix });
  if (!b.psu) return fail('no-psu', 'Nada acontece', 'Sem fonte de energia, nenhuma peça recebe eletricidade.', 'Instale uma fonte.');
  if (!b.mobo) return fail('no-mobo', 'Nada acontece', 'Sem placa-mãe não há onde ligar o botão de energia.', 'Instale a placa-mãe.');
  if (!cables.atx24) return fail('cable-24', 'Nada acontece', 'O cabo principal de 24 pinos não está ligado: a placa-mãe não recebe energia.', 'Conecte o cabo de 24 pinos da fonte na placa-mãe.');
  if (a.issues.some(i => i.title.startsWith('Processador não encaixa'))) return fail('socket', 'Tela preta', 'O processador não é compatível com a placa-mãe.', 'Troque o processador ou a placa-mãe para terem o mesmo soquete.');
  if (b.psu && a.power.idle > a.power.psuReal) return fail('psu-dead', 'Liga e desliga na hora', `A fonte não aguenta nem o PC parado (${a.power.idle} W).`, `Use uma fonte de ${a.power.recommended} W ou mais.`);
  if (!b.cpu) return fail('no-cpu', 'As ventoinhas giram, mas a tela fica preta', 'Sem processador, nada é executado.', 'Instale o processador no soquete.');
  if (!cables.eps) return fail('cable-eps', 'As ventoinhas giram, mas a tela fica preta', 'O cabo de energia do processador (8 pinos, no canto de cima) não está ligado.', 'Conecte o cabo de 8 pinos (EPS) no topo da placa-mãe.');
  if (!b.cooler) return fail('no-cooler', 'Liga e desliga em segundos', 'Sem cooler, o processador passa de 100 °C quase na hora e o PC se desliga para se proteger.', 'Instale um cooler sobre o processador (com pasta térmica).');
  if (!b.ram.length) return fail('no-ram', 'Bipe… bipe… bipe…', 'Bipes longos repetidos: é o jeito da placa-mãe avisar que não encontrou memória RAM.', 'Encaixe pelo menos um pente de memória.');
  if (!b.gpu && !(b.cpu.specs.igpu > 0)) return fail('no-video', 'Liga, mas a tela fica preta', 'Este processador não tem vídeo integrado e não há placa de vídeo.', 'Instale uma placa de vídeo.');
  if (b.gpu && b.gpu.specs.power && !cables.pcie) return fail('cable-pcie', 'Liga, mas a tela fica preta', 'A placa de vídeo está sem o cabo de energia dela.', 'Conecte o cabo PCIe da fonte na placa de vídeo.');
  const usable = b.storage.filter(s => s.specs.kind === 'nvme' || (cables.sata || {})[s.uid]);
  if (!b.storage.length) return fail('no-storage', 'Liga, mas para numa tela de erro', '"Nenhum dispositivo de inicialização encontrado": não há onde o Windows esteja instalado.', 'Instale um SSD ou HD.');
  if (!usable.length) return fail('cable-sata', 'Liga, mas para numa tela de erro', '"Nenhum dispositivo de inicialização encontrado": o SSD/HD está sem cabos SATA.', 'Conecte os cabos SATA (dados e energia) no disco.');
  const warnings = [];
  if (a.power.load > a.power.psuReal) warnings.push('A fonte é fraca: o PC liga, mas vai desligar sozinho quando você abrir um jogo.');
  if (b.loose) warnings.push(`${b.loose} peça(s) sem todos os parafusos. Funciona, mas pode soltar e estragar.`);
  if (!b.paste) warnings.push('Sem pasta térmica o processador esquenta muito.');
  return { ok: true, warnings };
}

export function scoreText(v, beyond) {
  return beyond ? '100+' : fmtNum(v);
}
