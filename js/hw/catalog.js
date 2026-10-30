// Catálogo de peças. Preços são aproximados (R$) e servem só para comparação.
// Índices de desempenho: gpu.idx usa RTX 4060 = 100 (jogos em 1080p);
// cpu.st / cpu.mt usam Ryzen 5 5600 ≈ 88 / 58 (um núcleo / todos os núcleos).

export const CATEGORIES = [
  { id: 'case', name: 'Gabinete', plural: 'Gabinetes', required: true,
    short: 'A "casa" do computador, onde todas as peças ficam presas.' },
  { id: 'psu', name: 'Fonte', plural: 'Fontes', required: true,
    short: 'Transforma a energia da tomada na energia que as peças usam.' },
  { id: 'mobo', name: 'Placa-mãe', plural: 'Placas-mãe', required: true,
    short: 'A placa grande onde todas as outras peças se conectam.' },
  { id: 'cpu', name: 'Processador', plural: 'Processadores', required: true,
    short: 'O "cérebro": faz as contas de tudo que o computador executa.' },
  { id: 'cooler', name: 'Cooler', plural: 'Coolers', required: true,
    short: 'Esfria o processador para ele não superaquecer.' },
  { id: 'ram', name: 'Memória RAM', plural: 'Memórias RAM', required: true,
    short: 'A "mesa de trabalho": guarda o que está aberto agora.' },
  { id: 'storage', name: 'Armazenamento', plural: 'Armazenamento', required: true,
    short: 'O "armário": guarda o Windows, programas, fotos e arquivos.' },
  { id: 'gpu', name: 'Placa de vídeo', plural: 'Placas de vídeo', required: false,
    short: 'Desenha as imagens na tela. Essencial para jogos e edição.' },
  { id: 'fan', name: 'Ventoinha', plural: 'Ventoinhas', required: false,
    short: 'Ventiladores do gabinete: puxam ar fresco e tiram o ar quente.' },
];

export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const TIERS = {
  antiga: { label: 'Antiga', order: 0 },
  basica: { label: 'Básica', order: 1 },
  intermediaria: { label: 'Intermediária', order: 2 },
  avancada: { label: 'Avançada', order: 3 },
  topo: { label: 'Topo de linha', order: 4 },
  custom: { label: 'Personalizada', order: 5 },
};

export const SOCKET_RAM = {
  LGA1155: ['DDR3'], LGA1150: ['DDR3'], 'AM3+': ['DDR3'], LGA1151: ['DDR4'], LGA1200: ['DDR4'],
  AM4: ['DDR4'], LGA1700: ['DDR4', 'DDR5'], LGA1851: ['DDR5'], AM5: ['DDR5'],
};

const P = [];
const add = (cat, list) => list.forEach(p => P.push({ cat, ...p }));

/* ------------------------------ GABINETES ------------------------------ */
add('case', [
  {
    id: 'case-bege', name: 'Gabinete Bege Clássico', brand: 'Genérico', year: 2006, tier: 'antiga', price: 60,
    desc: 'Aquele gabinete bege de escritório dos anos 2000. Pequeno, sem vidro, com a fonte em cima. Só cabe placa-mãe micro-ATX e placas de vídeo curtas.',
    specs: { forms: ['mATX'], maxGpu: 22, maxCooler: 13, radiators: [], fansIncluded: 0, fanSlots: { front: 1, top: 0, rear: 1 },
      dims: { d: 42, h: 38, w: 20.5 }, psuPos: 'top', glass: 'none', bays35: 2, bays25: 0, style: 'classic' },
    look: { color: '#d8d0bc', accent: '#b9b09a', inner: '#c9c1ad' },
  },
  {
    id: 'case-basico', name: 'Gabinete Gamer Básico com Vidro', brand: 'Genérico', year: 2021, tier: 'basica', price: 220,
    desc: 'Mid-tower simples com lateral de vidro e uma ventoinha traseira. Cabe placa-mãe ATX e a maioria das placas de vídeo.',
    specs: { forms: ['ATX', 'mATX', 'ITX'], maxGpu: 32, maxCooler: 15.8, radiators: [240], fansIncluded: 1, fanSlots: { front: 3, top: 2, rear: 1 },
      dims: { d: 44, h: 47, w: 21.5 }, psuPos: 'bottom', glass: 'side', bays35: 2, bays25: 2, style: 'mesh' },
    look: { color: '#1b1d20', accent: '#2a2d31', inner: '#202326' },
  },
  {
    id: 'case-airflow', name: 'Mid-Tower Airflow Mesh', brand: 'Montech', year: 2023, tier: 'intermediaria', price: 450,
    desc: 'Frente toda em tela para o ar entrar fácil e 4 ventoinhas já inclusas. Mantém as peças frescas, ótimo para PCs gamer.',
    specs: { forms: ['ATX', 'mATX', 'ITX'], maxGpu: 38, maxCooler: 16.5, radiators: [240, 360], fansIncluded: 4, fanSlots: { front: 3, top: 3, rear: 1 },
      dims: { d: 46, h: 49, w: 23 }, psuPos: 'bottom', glass: 'side', bays35: 2, bays25: 2, style: 'mesh' },
    look: { color: '#141518', accent: '#22252a', inner: '#1a1c20' },
  },
  {
    id: 'case-aquario', name: 'Gabinete Aquário Branco', brand: 'Genérico', year: 2024, tier: 'intermediaria', price: 520,
    desc: 'Vidro na frente e na lateral, para deixar as peças à mostra como num aquário. Muito usado em setups com luzes RGB.',
    specs: { forms: ['ATX', 'mATX', 'ITX'], maxGpu: 40, maxCooler: 16.8, radiators: [240, 360], fansIncluded: 0, fanSlots: { front: 0, top: 3, rear: 1 },
      dims: { d: 42, h: 47, w: 28 }, psuPos: 'bottom', glass: 'side-front', bays35: 1, bays25: 2, style: 'aquario' },
    look: { color: '#eef0f2', accent: '#d9dde1', inner: '#e4e7ea' },
  },
  {
    id: 'case-north', name: 'Gabinete Premium Madeira', brand: 'Fractal Design', year: 2023, tier: 'avancada', price: 1150,
    desc: 'Acabamento com frente de madeira, silencioso e com ótimo fluxo de ar. Para quem quer um PC bonito na sala.',
    specs: { forms: ['ATX', 'mATX', 'ITX'], maxGpu: 35.5, maxCooler: 17, radiators: [240, 360], fansIncluded: 2, fanSlots: { front: 3, top: 3, rear: 1 },
      dims: { d: 45, h: 47, w: 21.5 }, psuPos: 'bottom', glass: 'side', bays35: 2, bays25: 2, style: 'wood' },
    look: { color: '#2b2d2a', accent: '#8a5a33', inner: '#2f312e' },
  },
  {
    id: 'case-itx', name: 'Mini Gabinete ITX', brand: 'Cooler Master', year: 2022, tier: 'avancada', price: 700,
    desc: 'Compacto, cabe em cima da mesa ou ao lado da TV. Só aceita placa-mãe Mini-ITX (a menor de todas) e placas de vídeo de até 3 slots.',
    specs: { forms: ['ITX'], maxGpu: 31, maxCooler: 14, radiators: [240], fansIncluded: 1, fanSlots: { front: 0, top: 2, rear: 1 },
      dims: { d: 34, h: 37, w: 20 }, psuPos: 'bottom', glass: 'side', bays35: 0, bays25: 2, style: 'itx' },
    look: { color: '#232528', accent: '#c23b3b', inner: '#26282b' },
  },
]);

/* ------------------------------ FONTES ------------------------------ */
add('psu', [
  {
    id: 'psu-gen500', name: 'Fonte Genérica 500W (sem selo)', brand: 'Genérica', year: 2015, tier: 'antiga', price: 110,
    desc: 'Promete 500W, mas na prática entrega uns 300W com segurança. Sem selo de eficiência: esquenta, gasta mais luz e pode queimar peças. Cuidado!',
    specs: { watts: 500, realWatts: 300, rating: 'Sem selo', modular: false, atx3: false },
    look: { color: '#8f949a', label: '#c33' },
  },
  {
    id: 'psu-450b', name: 'Corsair CV450 450W', brand: 'Corsair', year: 2020, tier: 'basica', price: 270,
    desc: 'Fonte confiável para PCs de escritório ou com placa de vídeo econômica. Selo 80 Plus Bronze.',
    specs: { watts: 450, realWatts: 450, rating: '80 Plus Bronze', modular: false, atx3: false },
    look: { color: '#1a1a1a', label: '#d4a017' },
  },
  {
    id: 'psu-550b', name: 'MSI MAG A550BN 550W', brand: 'MSI', year: 2021, tier: 'basica', price: 330,
    desc: 'Boa escolha para PCs gamer de entrada, como RTX 4060 ou RX 6600. Selo 80 Plus Bronze.',
    specs: { watts: 550, realWatts: 550, rating: '80 Plus Bronze', modular: false, atx3: false },
    look: { color: '#161616', label: '#c62828' },
  },
  {
    id: 'psu-650b', name: 'Corsair CX650 650W', brand: 'Corsair', year: 2022, tier: 'intermediaria', price: 430,
    desc: 'Energia de sobra para PCs intermediários. Selo 80 Plus Bronze.',
    specs: { watts: 650, realWatts: 650, rating: '80 Plus Bronze', modular: false, atx3: false },
    look: { color: '#1a1a1a', label: '#d4a017' },
  },
  {
    id: 'psu-750g', name: 'XPG Core Reactor II 750W', brand: 'XPG', year: 2023, tier: 'avancada', price: 650,
    desc: 'Modular (você só conecta os cabos que vai usar) e 80 Plus Gold: mais eficiente, gasta menos luz.',
    specs: { watts: 750, realWatts: 750, rating: '80 Plus Gold', modular: true, atx3: false },
    look: { color: '#202020', label: '#e53935' },
  },
  {
    id: 'psu-850g', name: 'Corsair RM850e 850W ATX 3.0', brand: 'Corsair', year: 2023, tier: 'avancada', price: 850,
    desc: 'Padrão ATX 3.0, com o cabo novo de 16 pinos das placas de vídeo modernas. 80 Plus Gold e silenciosa.',
    specs: { watts: 850, realWatts: 850, rating: '80 Plus Gold', modular: true, atx3: true },
    look: { color: '#141414', label: '#f2c94c' },
  },
  {
    id: 'psu-1000g', name: 'MSI MPG A1000G 1000W', brand: 'MSI', year: 2023, tier: 'topo', price: 1150,
    desc: 'Para PCs muito fortes, com placas de vídeo de ponta. 80 Plus Gold, ATX 3.0.',
    specs: { watts: 1000, realWatts: 1000, rating: '80 Plus Gold', modular: true, atx3: true },
    look: { color: '#121212', label: '#c62828' },
  },
  {
    id: 'psu-1500p', name: 'Corsair HX1500i 1500W', brand: 'Corsair', year: 2023, tier: 'topo', price: 2600,
    desc: 'Uma das fontes mais potentes do mercado. 80 Plus Platinum. Exagero para quase todo mundo.',
    specs: { watts: 1500, realWatts: 1500, rating: '80 Plus Platinum', modular: true, atx3: true },
    look: { color: '#0f0f0f', label: '#b0bec5' },
  },
]);

/* ------------------------------ PLACAS-MÃE ------------------------------ */
add('mobo', [
  {
    id: 'mb-h61', name: 'Gigabyte GA-H61M-S2', brand: 'Gigabyte', year: 2011, tier: 'antiga', price: 150,
    desc: 'Placa-mãe antiga para processadores Intel de 2ª e 3ª geração (soquete LGA1155). Usa memória DDR3 e não tem entrada para SSD M.2.',
    specs: { socket: 'LGA1155', chipset: 'H61', ramType: 'DDR3', form: 'mATX', ramSlots: 2, maxRam: 16, maxRamSpeed: 1333, m2Slots: 0, sata: 4, pcieGen: 2, wifi: false, oc: false },
    look: { pcb: '#1f5a2e', accent: '#2a6fb0', slot: '#2b62c4' },
  },
  {
    id: 'mb-970', name: 'ASUS M5A97 R2.0', brand: 'ASUS', year: 2012, tier: 'antiga', price: 300,
    desc: 'Placa ATX antiga para processadores AMD FX (soquete AM3+). Memória DDR3.',
    specs: { socket: 'AM3+', chipset: '970', ramType: 'DDR3', form: 'ATX', ramSlots: 4, maxRam: 32, maxRamSpeed: 1866, m2Slots: 0, sata: 6, pcieGen: 2, wifi: false, oc: true },
    look: { pcb: '#3a2a1e', accent: '#c7a14a', slot: '#1e1e1e' },
  },
  {
    id: 'mb-h81', name: 'ASUS H81M-K', brand: 'ASUS', year: 2014, tier: 'antiga', price: 180,
    desc: 'Para processadores Intel de 4ª geração, como o i7-4790 (soquete LGA1150). DDR3.',
    specs: { socket: 'LGA1150', chipset: 'H81', ramType: 'DDR3', form: 'mATX', ramSlots: 2, maxRam: 16, maxRamSpeed: 1600, m2Slots: 0, sata: 4, pcieGen: 2, wifi: false, oc: false },
    look: { pcb: '#1d1f24', accent: '#8a95a5', slot: '#3a3f47' },
  },
  {
    id: 'mb-h510', name: 'ASUS PRIME H510M-E', brand: 'ASUS', year: 2021, tier: 'basica', price: 450,
    desc: 'Placa simples para Intel de 10ª e 11ª geração (LGA1200). Tem 1 entrada M.2 para SSD rápido.',
    specs: { socket: 'LGA1200', chipset: 'H510', ramType: 'DDR4', form: 'mATX', ramSlots: 2, maxRam: 64, maxRamSpeed: 2933, m2Slots: 1, sata: 4, pcieGen: 3, wifi: false, oc: false },
    look: { pcb: '#1b1d22', accent: '#9aa3ae', slot: '#2d3138' },
  },
  {
    id: 'mb-b450', name: 'Gigabyte B450M DS3H', brand: 'Gigabyte', year: 2018, tier: 'basica', price: 480,
    desc: 'Muito popular para Ryzen (soquete AM4). Barata, com 4 entradas de memória DDR4 e 1 M.2.',
    specs: { socket: 'AM4', chipset: 'B450', ramType: 'DDR4', form: 'mATX', ramSlots: 4, maxRam: 64, maxRamSpeed: 3200, m2Slots: 1, sata: 4, pcieGen: 3, wifi: false, oc: true },
    look: { pcb: '#18191c', accent: '#6d7682', slot: '#2b2e33' },
  },
  {
    id: 'mb-b550', name: 'ASUS TUF Gaming B550-Plus', brand: 'ASUS', year: 2020, tier: 'intermediaria', price: 1000,
    desc: 'Placa ATX robusta para Ryzen AM4, com 2 entradas M.2 e PCIe 4.0 (mais velocidade para SSD e placa de vídeo).',
    specs: { socket: 'AM4', chipset: 'B550', ramType: 'DDR4', form: 'ATX', ramSlots: 4, maxRam: 128, maxRamSpeed: 3600, m2Slots: 2, sata: 6, pcieGen: 4, wifi: false, oc: true },
    look: { pcb: '#1a1b1d', accent: '#c9a227', slot: '#3b3d40' },
  },
  {
    id: 'mb-b760d4', name: 'Gigabyte B760M DS3H DDR4', brand: 'Gigabyte', year: 2023, tier: 'intermediaria', price: 750,
    desc: 'Para Intel de 12ª a 14ª geração (LGA1700) usando memória DDR4, que é mais barata.',
    specs: { socket: 'LGA1700', chipset: 'B760', ramType: 'DDR4', form: 'mATX', ramSlots: 4, maxRam: 128, maxRamSpeed: 3200, m2Slots: 2, sata: 4, pcieGen: 4, wifi: false, oc: false },
    look: { pcb: '#191a1d', accent: '#7f8893', slot: '#2b2e33' },
  },
  {
    id: 'mb-z790', name: 'MSI PRO Z790-A WIFI', brand: 'MSI', year: 2022, tier: 'avancada', price: 1900,
    desc: 'Placa ATX completa para Intel LGA1700 com DDR5, Wi-Fi, 4 entradas M.2 e suporte a overclock.',
    specs: { socket: 'LGA1700', chipset: 'Z790', ramType: 'DDR5', form: 'ATX', ramSlots: 4, maxRam: 192, maxRamSpeed: 7200, m2Slots: 4, sata: 6, pcieGen: 5, wifi: true, oc: true },
    look: { pcb: '#d9dcdf', accent: '#c0c4c9', slot: '#eceff1', silk: '#3a3f45' },
  },
  {
    id: 'mb-z890', name: 'ASUS ROG Strix Z890-A', brand: 'ASUS', year: 2024, tier: 'topo', price: 3200,
    desc: 'Topo de linha para os Intel Core Ultra (LGA1851). DDR5 muito rápida, Wi-Fi 7 e 5 entradas M.2.',
    specs: { socket: 'LGA1851', chipset: 'Z890', ramType: 'DDR5', form: 'ATX', ramSlots: 4, maxRam: 192, maxRamSpeed: 8000, m2Slots: 4, sata: 4, pcieGen: 5, wifi: true, oc: true },
    look: { pcb: '#e3e5e8', accent: '#b8bdc3', slot: '#f2f3f5', silk: '#3a3f45' },
  },
  {
    id: 'mb-b650m', name: 'ASRock B650M-HDV/M.2', brand: 'ASRock', year: 2022, tier: 'intermediaria', price: 900,
    desc: 'A porta de entrada para os Ryzen mais novos (AM5), que usam DDR5. Tem 2 entradas de memória e 2 M.2.',
    specs: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', form: 'mATX', ramSlots: 2, maxRam: 96, maxRamSpeed: 6400, m2Slots: 2, sata: 4, pcieGen: 4, wifi: false, oc: true },
    look: { pcb: '#1a1b1e', accent: '#8e97a3', slot: '#2b2e33' },
  },
  {
    id: 'mb-b650', name: 'Gigabyte B650 AORUS Elite AX', brand: 'Gigabyte', year: 2022, tier: 'avancada', price: 1700,
    desc: 'ATX para Ryzen AM5 com Wi-Fi, 3 entradas M.2 e bons dissipadores. Equilibrada para PCs gamer fortes.',
    specs: { socket: 'AM5', chipset: 'B650', ramType: 'DDR5', form: 'ATX', ramSlots: 4, maxRam: 192, maxRamSpeed: 7600, m2Slots: 3, sata: 4, pcieGen: 5, wifi: true, oc: true },
    look: { pcb: '#17181a', accent: '#e07b24', slot: '#2b2e33' },
  },
  {
    id: 'mb-x870e', name: 'ASUS ROG Strix X870E-E', brand: 'ASUS', year: 2024, tier: 'topo', price: 3600,
    desc: 'Placa de luxo para Ryzen AM5: tudo do mais rápido, PCIe 5.0, Wi-Fi 7 e 5 entradas M.2.',
    specs: { socket: 'AM5', chipset: 'X870E', ramType: 'DDR5', form: 'ATX', ramSlots: 4, maxRam: 192, maxRamSpeed: 8000, m2Slots: 4, sata: 4, pcieGen: 5, wifi: true, oc: true },
    look: { pcb: '#141517', accent: '#d2283a', slot: '#2b2e33' },
  },
  {
    id: 'mb-b650i', name: 'ASUS ROG Strix B650E-I', brand: 'ASUS', year: 2022, tier: 'avancada', price: 2300,
    desc: 'Mini-ITX: a menor placa-mãe, para PCs compactos. Só 2 entradas de memória e 1 de placa de vídeo.',
    specs: { socket: 'AM5', chipset: 'B650E', ramType: 'DDR5', form: 'ITX', ramSlots: 2, maxRam: 96, maxRamSpeed: 7000, m2Slots: 1, sata: 2, pcieGen: 5, wifi: true, oc: true },
    look: { pcb: '#151618', accent: '#c23b3b', slot: '#2b2e33' },
  },
]);

/* ------------------------------ PROCESSADORES ------------------------------ */
add('cpu', [
  {
    id: 'cpu-i5-2400', name: 'Intel Core i5-2400', brand: 'Intel', year: 2011, tier: 'antiga', price: 60,
    desc: 'Processador de 2011 com 4 núcleos. Ainda serve para navegar e usar o Office, mas sofre com jogos e programas atuais.',
    specs: { socket: 'LGA1155', cores: 4, threads: 4, baseGHz: 3.1, boostGHz: 3.4, tdp: 95, tdpMax: 95, igpu: 2, igpuName: 'Intel HD 2000', st: 38, mt: 16, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-fx8350', name: 'AMD FX-8350', brand: 'AMD', year: 2012, tier: 'antiga', price: 150,
    desc: 'Tinha 8 núcleos em 2012, mas cada núcleo é fraco e esquenta muito. Hoje é bem lento. Não tem vídeo integrado.',
    specs: { socket: 'AM3+', cores: 8, threads: 8, baseGHz: 4.0, boostGHz: 4.2, tdp: 125, tdpMax: 125, igpu: 0, st: 32, mt: 24, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-i7-4790', name: 'Intel Core i7-4790', brand: 'Intel', year: 2014, tier: 'antiga', price: 250,
    desc: 'Foi topo de linha em 2014. Com uma placa de vídeo razoável ainda roda jogos leves e médios.',
    specs: { socket: 'LGA1150', cores: 4, threads: 8, baseGHz: 3.6, boostGHz: 4.0, tdp: 84, tdpMax: 84, igpu: 4, igpuName: 'Intel HD 4600', st: 50, mt: 25, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-i3-10100f', name: 'Intel Core i3-10100F', brand: 'Intel', year: 2020, tier: 'basica', price: 380,
    desc: '4 núcleos e 8 threads, barato. O "F" no nome significa que não tem vídeo integrado: precisa de placa de vídeo.',
    specs: { socket: 'LGA1200', cores: 4, threads: 8, baseGHz: 3.6, boostGHz: 4.3, tdp: 65, tdpMax: 90, igpu: 0, st: 68, mt: 28, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-i3-12100', name: 'Intel Core i3-12100', brand: 'Intel', year: 2022, tier: 'basica', price: 560,
    desc: 'Ótimo para PCs de escritório e estudo: rápido no dia a dia, econômico e com vídeo integrado.',
    specs: { socket: 'LGA1700', cores: 4, threads: 8, baseGHz: 3.3, boostGHz: 4.3, tdp: 60, tdpMax: 89, igpu: 6, igpuName: 'Intel UHD 730', st: 95, mt: 38, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-r5-5600g', name: 'AMD Ryzen 5 5600G', brand: 'AMD', year: 2021, tier: 'basica', price: 650,
    desc: '6 núcleos com um vídeo integrado razoável (Radeon Vega 7). Roda jogos leves sem placa de vídeo.',
    specs: { socket: 'AM4', cores: 6, threads: 12, baseGHz: 3.9, boostGHz: 4.4, tdp: 65, tdpMax: 88, igpu: 13, igpuName: 'Radeon Vega 7', st: 84, mt: 55, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-r5-5600', name: 'AMD Ryzen 5 5600', brand: 'AMD', year: 2022, tier: 'intermediaria', price: 600,
    desc: 'Um dos processadores mais vendidos para PC gamer custo-benefício. 6 núcleos e 12 threads. Precisa de placa de vídeo.',
    specs: { socket: 'AM4', cores: 6, threads: 12, baseGHz: 3.5, boostGHz: 4.4, tdp: 65, tdpMax: 88, igpu: 0, st: 88, mt: 58, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-i5-12400f', name: 'Intel Core i5-12400F', brand: 'Intel', year: 2022, tier: 'intermediaria', price: 650,
    desc: 'Concorrente direto do Ryzen 5 5600: 6 núcleos, ótimo para jogos. Sem vídeo integrado.',
    specs: { socket: 'LGA1700', cores: 6, threads: 12, baseGHz: 2.5, boostGHz: 4.4, tdp: 65, tdpMax: 117, igpu: 0, st: 100, mt: 60, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-r7-5700x3d', name: 'AMD Ryzen 7 5700X3D', brand: 'AMD', year: 2024, tier: 'intermediaria', price: 1300,
    desc: 'Tem uma memória cache extra empilhada (3D V-Cache) que acelera muito os jogos. Excelente para quem já tem placa AM4.',
    specs: { socket: 'AM4', cores: 8, threads: 16, baseGHz: 3.0, boostGHz: 4.1, tdp: 105, tdpMax: 140, igpu: 0, st: 84, mt: 72, x3d: true, stockCooler: false },
  },
  {
    id: 'cpu-r5-7600', name: 'AMD Ryzen 5 7600', brand: 'AMD', year: 2023, tier: 'intermediaria', price: 1100,
    desc: '6 núcleos da geração AM5 com DDR5. Rápido e com caminho para upgrade no futuro.',
    specs: { socket: 'AM5', cores: 6, threads: 12, baseGHz: 3.8, boostGHz: 5.1, tdp: 65, tdpMax: 88, igpu: 5, igpuName: 'Radeon (2 núcleos)', st: 110, mt: 70, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-r7-8700g', name: 'AMD Ryzen 7 8700G', brand: 'AMD', year: 2024, tier: 'avancada', price: 1900,
    desc: 'O processador com o vídeo integrado mais forte (Radeon 780M). Roda muitos jogos em 1080p no baixo sem placa de vídeo.',
    specs: { socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.2, boostGHz: 5.1, tdp: 65, tdpMax: 88, igpu: 28, igpuName: 'Radeon 780M', st: 112, mt: 85, x3d: false, stockCooler: true },
  },
  {
    id: 'cpu-i5-14600k', name: 'Intel Core i5-14600K', brand: 'Intel', year: 2023, tier: 'avancada', price: 1700,
    desc: '14 núcleos (6 de desempenho + 8 econômicos). Muito bom em jogos e em trabalho pesado. Esquenta: precisa de cooler bom.',
    specs: { socket: 'LGA1700', cores: 14, threads: 20, baseGHz: 3.5, boostGHz: 5.3, tdp: 125, tdpMax: 181, igpu: 7, igpuName: 'Intel UHD 770', st: 120, mt: 120, x3d: false, stockCooler: false },
  },
  {
    id: 'cpu-r7-7800x3d', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', year: 2023, tier: 'avancada', price: 2300,
    desc: 'Lendário nos jogos graças ao 3D V-Cache. Consome pouco para o desempenho que entrega.',
    specs: { socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.2, boostGHz: 5.0, tdp: 120, tdpMax: 120, igpu: 5, igpuName: 'Radeon (2 núcleos)', st: 108, mt: 92, x3d: true, stockCooler: false },
  },
  {
    id: 'cpu-u7-265k', name: 'Intel Core Ultra 7 265K', brand: 'Intel', year: 2024, tier: 'avancada', price: 2600,
    desc: '20 núcleos, nova geração da Intel (LGA1851). Excelente para edição de vídeo e programas pesados.',
    specs: { socket: 'LGA1851', cores: 20, threads: 20, baseGHz: 3.9, boostGHz: 5.5, tdp: 125, tdpMax: 250, igpu: 12, igpuName: 'Intel Graphics (Xe)', st: 134, mt: 180, x3d: false, stockCooler: false },
  },
  {
    id: 'cpu-i9-14900k', name: 'Intel Core i9-14900K', brand: 'Intel', year: 2023, tier: 'topo', price: 3500,
    desc: '24 núcleos e até 6 GHz. Muito rápido, mas consome muita energia e exige refrigeração forte (water cooler).',
    specs: { socket: 'LGA1700', cores: 24, threads: 32, baseGHz: 3.2, boostGHz: 6.0, tdp: 125, tdpMax: 253, igpu: 7, igpuName: 'Intel UHD 770', st: 132, mt: 200, x3d: false, stockCooler: false },
  },
  {
    id: 'cpu-r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', year: 2024, tier: 'topo', price: 3200,
    desc: 'O processador mais rápido para jogos desta lista. 8 núcleos com 3D V-Cache de segunda geração.',
    specs: { socket: 'AM5', cores: 8, threads: 16, baseGHz: 4.7, boostGHz: 5.2, tdp: 120, tdpMax: 162, igpu: 5, igpuName: 'Radeon (2 núcleos)', st: 124, mt: 112, x3d: true, stockCooler: false },
  },
  {
    id: 'cpu-r9-9950x', name: 'AMD Ryzen 9 9950X', brand: 'AMD', year: 2024, tier: 'topo', price: 3900,
    desc: '16 núcleos e 32 threads: um monstro para renderização 3D, edição em 4K e programação pesada.',
    specs: { socket: 'AM5', cores: 16, threads: 32, baseGHz: 4.3, boostGHz: 5.7, tdp: 170, tdpMax: 230, igpu: 5, igpuName: 'Radeon (2 núcleos)', st: 140, mt: 230, x3d: false, stockCooler: false },
  },
]);

/* ------------------------------ COOLERS ------------------------------ */
add('cooler', [
  {
    id: 'cool-box', name: 'Cooler Box (o que vem na caixa)', brand: 'Intel / AMD', year: 2018, tier: 'basica', price: 40,
    desc: 'O cooler simples que vem junto com muitos processadores. Dá conta de processadores de até ~65W, mas é barulhento quando exigido.',
    specs: { kind: 'box', capacity: 95, heightCM: 5.8, fans: 1, rgb: false },
    look: { color: '#2b2b2b', fin: '#b9bcc0' },
  },
  {
    id: 'cool-212', name: 'Cooler Master Hyper 212', brand: 'Cooler Master', year: 2012, tier: 'antiga', price: 180,
    desc: 'Clássico cooler de torre com 4 tubos de calor (heatpipes). Bom upgrade em relação ao cooler box.',
    specs: { kind: 'tower', capacity: 150, heightCM: 15.9, fans: 1, rgb: false },
    look: { color: '#222', fin: '#c4c7cb', fan: '#1d1d1d' },
  },
  {
    id: 'cool-ak400', name: 'DeepCool AK400', brand: 'DeepCool', year: 2022, tier: 'intermediaria', price: 200,
    desc: 'Torre com 4 heatpipes e uma ventoinha de 12 cm. Silencioso e eficiente, ótimo custo-benefício.',
    specs: { kind: 'tower', capacity: 190, heightCM: 15.5, fans: 1, rgb: false },
    look: { color: '#151515', fin: '#2a2c2f', fan: '#141414', top: '#111' },
  },
  {
    id: 'cool-pa120', name: 'Thermalright Peerless Assassin 120 SE', brand: 'Thermalright', year: 2022, tier: 'avancada', price: 260,
    desc: 'Torre dupla com 6 heatpipes e 2 ventoinhas. Esfria quase como um water cooler por um preço baixo.',
    specs: { kind: 'dual', capacity: 245, heightCM: 15.5, fans: 2, rgb: false },
    look: { color: '#1a1a1a', fin: '#c9ccd0', fan: '#121212' },
  },
  {
    id: 'cool-d15', name: 'Noctua NH-D15', brand: 'Noctua', year: 2014, tier: 'avancada', price: 800,
    desc: 'Um dos melhores coolers a ar já feitos. Enorme, silencioso, com as famosas ventoinhas cor de café com leite.',
    specs: { kind: 'dual', capacity: 260, heightCM: 16.5, fans: 2, rgb: false },
    look: { color: '#5b3a2c', fin: '#d1d4d8', fan: '#c8a98b', blade: '#6a4234' },
  },
  {
    id: 'cool-aio240', name: 'Water Cooler 240mm ARGB', brand: 'Lian Li', year: 2023, tier: 'avancada', price: 560,
    desc: 'Refrigeração líquida: uma bomba sobre o processador leva o calor por tubos até um radiador com 2 ventoinhas.',
    specs: { kind: 'aio', capacity: 260, heightCM: 3.6, radiator: 240, fans: 2, rgb: true },
    look: { color: '#121212', fin: '#1d1d1d', fan: '#151515', rgb: '#7c5cff' },
  },
  {
    id: 'cool-aio360', name: 'Water Cooler 360mm com tela', brand: 'NZXT', year: 2024, tier: 'topo', price: 1300,
    desc: 'Radiador grande de 36 cm com 3 ventoinhas e uma telinha na bomba. Para processadores que esquentam muito, como o i9.',
    specs: { kind: 'aio', capacity: 340, heightCM: 3.6, radiator: 360, fans: 3, rgb: true },
    look: { color: '#101010', fin: '#1b1b1b', fan: '#141414', rgb: '#00d0ff' },
  },
]);

/* ------------------------------ MEMÓRIA RAM ------------------------------ */
add('ram', [
  {
    id: 'ram-d3-4', name: 'Pente DDR3 4GB 1333MHz', brand: 'Kingston', year: 2011, tier: 'antiga', price: 25,
    desc: 'Memória antiga, só funciona em placas DDR3. Com 4GB o Windows atual fica bem lento.',
    specs: { type: 'DDR3', gb: 4, mhz: 1333, cl: 9, rgb: false }, look: { color: '#1f6b2e', bare: true },
  },
  {
    id: 'ram-d3-8', name: 'Pente DDR3 8GB 1600MHz', brand: 'Corsair', year: 2013, tier: 'antiga', price: 45,
    desc: 'O máximo que muitas placas DDR3 usavam por pente. Para PCs antigos.',
    specs: { type: 'DDR3', gb: 8, mhz: 1600, cl: 10, rgb: false }, look: { color: '#1a1a1a' },
  },
  {
    id: 'ram-d4-8', name: 'Pente DDR4 8GB 3200MHz', brand: 'Kingston Fury', year: 2020, tier: 'basica', price: 110,
    desc: 'Pente de entrada. Use dois (16GB no total) para ativar o dual channel e ganhar desempenho.',
    specs: { type: 'DDR4', gb: 8, mhz: 3200, cl: 16, rgb: false }, look: { color: '#1b1b1b' },
  },
  {
    id: 'ram-d4-16', name: 'Pente DDR4 16GB 3200MHz', brand: 'Corsair Vengeance', year: 2020, tier: 'intermediaria', price: 220,
    desc: 'Dois desses dão 32GB: tranquilo para jogos e edição de vídeo leve.',
    specs: { type: 'DDR4', gb: 16, mhz: 3200, cl: 16, rgb: false }, look: { color: '#141414' },
  },
  {
    id: 'ram-d4-16rgb', name: 'Pente DDR4 16GB 3600MHz RGB', brand: 'XPG Spectrix', year: 2021, tier: 'intermediaria', price: 270,
    desc: 'Mais rápido (3600MHz) e com luzes RGB no topo.',
    specs: { type: 'DDR4', gb: 16, mhz: 3600, cl: 18, rgb: true }, look: { color: '#2a2a2e' },
  },
  {
    id: 'ram-d5-8', name: 'Pente DDR5 8GB 4800MHz', brand: 'Crucial', year: 2022, tier: 'basica', price: 180,
    desc: 'DDR5 básica. Funciona só em placas DDR5. Prefira usar em par.',
    specs: { type: 'DDR5', gb: 8, mhz: 4800, cl: 40, rgb: false }, look: { color: '#1f6b2e', bare: true },
  },
  {
    id: 'ram-d5-16', name: 'Pente DDR5 16GB 5600MHz', brand: 'Kingston Fury Beast', year: 2023, tier: 'intermediaria', price: 340,
    desc: 'O mais comum em PCs novos: dois pentes = 32GB DDR5.',
    specs: { type: 'DDR5', gb: 16, mhz: 5600, cl: 36, rgb: false }, look: { color: '#161616' },
  },
  {
    id: 'ram-d5-16rgb', name: 'Pente DDR5 16GB 6000MHz RGB', brand: 'Corsair Vengeance', year: 2023, tier: 'avancada', price: 430,
    desc: '6000MHz é a velocidade ideal para Ryzen AM5. Com RGB.',
    specs: { type: 'DDR5', gb: 16, mhz: 6000, cl: 30, rgb: true }, look: { color: '#e8e8ea' },
  },
  {
    id: 'ram-d5-32rgb', name: 'Pente DDR5 32GB 6400MHz RGB', brand: 'G.Skill Trident Z5', year: 2024, tier: 'topo', price: 900,
    desc: 'Dois pentes = 64GB muito rápidos. Para edição profissional, IA e máquinas virtuais.',
    specs: { type: 'DDR5', gb: 32, mhz: 6400, cl: 32, rgb: true }, look: { color: '#b9bec4' },
  },
]);

/* ------------------------------ ARMAZENAMENTO ------------------------------ */
add('storage', [
  {
    id: 'hdd-1tb', name: 'HD Seagate BarraCuda 1TB', brand: 'Seagate', year: 2016, tier: 'antiga', price: 290,
    desc: 'HD mecânico: tem um disco girando dentro. Guarda bastante coisa, mas é lento para ligar o Windows e abrir programas.',
    specs: { kind: 'hdd', form: '3.5', gb: 1000, read: 200, gen: 0 }, look: { color: '#9aa0a6' },
  },
  {
    id: 'hdd-2tb', name: 'HD WD Blue 2TB', brand: 'Western Digital', year: 2019, tier: 'basica', price: 450,
    desc: 'Bom para guardar fotos, vídeos e backups. Use junto com um SSD para o Windows.',
    specs: { kind: 'hdd', form: '3.5', gb: 2000, read: 210, gen: 0 }, look: { color: '#8c9399' },
  },
  {
    id: 'ssd-a400', name: 'SSD Kingston A400 480GB', brand: 'Kingston', year: 2018, tier: 'basica', price: 210,
    desc: 'SSD de 2,5 polegadas (SATA). Até 3x mais rápido que um HD para ligar o PC. O melhor upgrade para PC lento.',
    specs: { kind: 'sata', form: '2.5', gb: 480, read: 500, gen: 0 }, look: { color: '#2b2b2b', label: '#c62828' },
  },
  {
    id: 'ssd-mx500', name: 'SSD Crucial MX500 1TB', brand: 'Crucial', year: 2018, tier: 'intermediaria', price: 420,
    desc: 'SSD SATA confiável e com bom espaço.',
    specs: { kind: 'sata', form: '2.5', gb: 1000, read: 560, gen: 0 }, look: { color: '#1f2a33', label: '#3d8bd4' },
  },
  {
    id: 'nvme-sn350', name: 'SSD M.2 NVMe WD Green 480GB', brand: 'Western Digital', year: 2021, tier: 'basica', price: 230,
    desc: 'SSD em formato de "chiclete" que encaixa direto na placa-mãe (M.2). Cerca de 4x mais rápido que o SATA.',
    specs: { kind: 'nvme', form: 'm2', gb: 480, read: 2400, gen: 3 }, look: { color: '#1b4d2b', label: '#37a35a' },
  },
  {
    id: 'nvme-nv3', name: 'SSD M.2 NVMe Kingston NV3 1TB', brand: 'Kingston', year: 2024, tier: 'intermediaria', price: 430,
    desc: 'PCIe 4.0, até 6.000 MB/s. Excelente custo-benefício para jogos.',
    specs: { kind: 'nvme', form: 'm2', gb: 1000, read: 6000, gen: 4 }, look: { color: '#141414', label: '#5b6cff' },
  },
  {
    id: 'nvme-990pro', name: 'SSD M.2 NVMe Samsung 990 PRO 2TB', brand: 'Samsung', year: 2022, tier: 'avancada', price: 1300,
    desc: 'Um dos SSDs mais rápidos de PCIe 4.0, com bastante espaço para jogos grandes.',
    specs: { kind: 'nvme', form: 'm2', gb: 2000, read: 7450, gen: 4 }, look: { color: '#121212', label: '#ff7a1a' },
  },
  {
    id: 'nvme-t705', name: 'SSD M.2 NVMe Crucial T705 2TB (PCIe 5.0)', brand: 'Crucial', year: 2024, tier: 'topo', price: 2300,
    desc: 'PCIe 5.0, mais de 14.000 MB/s. Velocidade extrema, vem com dissipador.',
    specs: { kind: 'nvme', form: 'm2', gb: 2000, read: 14500, gen: 5, heatsink: true }, look: { color: '#1a1a1a', label: '#c9ccd0' },
  },
]);

/* ------------------------------ PLACAS DE VÍDEO ------------------------------ */
add('gpu', [
  {
    id: 'gpu-gt730', name: 'NVIDIA GeForce GT 730 2GB', brand: 'NVIDIA', year: 2014, tier: 'antiga', price: 260,
    desc: 'Placa muito fraca, serve só para ligar monitores. Não espere rodar jogos atuais.',
    specs: { vram: 2, cores: 384, boostMHz: 902, tdp: 38, lengthCM: 17, slots: 1, fans: 1, rt: false, upscale: null, idx: 6, power: null },
    look: { shroud: '#1d1d1f', accent: '#5aa02c' },
  },
  {
    id: 'gpu-750ti', name: 'NVIDIA GeForce GTX 750 Ti 2GB', brand: 'NVIDIA', year: 2014, tier: 'antiga', price: 300,
    desc: 'Foi popular em 2014. Roda jogos leves como LoL e Minecraft, mas tem pouca memória de vídeo.',
    specs: { vram: 2, cores: 640, boostMHz: 1085, tdp: 60, lengthCM: 19, slots: 2, fans: 1, rt: false, upscale: null, idx: 13, power: null },
    look: { shroud: '#202022', accent: '#76b900' },
  },
  {
    id: 'gpu-1050ti', name: 'NVIDIA GeForce GTX 1050 Ti 4GB', brand: 'NVIDIA', year: 2016, tier: 'antiga', price: 450,
    desc: 'Placa econômica que não precisa de cabo de energia. Roda jogos competitivos no médio.',
    specs: { vram: 4, cores: 768, boostMHz: 1392, tdp: 75, lengthCM: 19, slots: 2, fans: 1, rt: false, upscale: null, idx: 22, power: null },
    look: { shroud: '#1b1b1d', accent: '#76b900' },
  },
  {
    id: 'gpu-rx580', name: 'AMD Radeon RX 580 8GB', brand: 'AMD', year: 2017, tier: 'basica', price: 550,
    desc: 'Muito comum em PCs gamer baratos no Brasil. 8GB de memória ajudam, mas consome bastante energia.',
    specs: { vram: 8, cores: 2304, boostMHz: 1340, tdp: 185, lengthCM: 24, slots: 2, fans: 2, rt: false, upscale: 'FSR', idx: 40, power: '8' },
    look: { shroud: '#1a1a1a', accent: '#d32f2f' },
  },
  {
    id: 'gpu-1660s', name: 'NVIDIA GeForce GTX 1660 Super 6GB', brand: 'NVIDIA', year: 2019, tier: 'basica', price: 900,
    desc: 'Boa para 1080p em jogos de 2019 a 2021. Não tem Ray Tracing.',
    specs: { vram: 6, cores: 1408, boostMHz: 1785, tdp: 125, lengthCM: 23, slots: 2, fans: 2, rt: false, upscale: 'FSR', idx: 50, power: '8' },
    look: { shroud: '#2a2b2e', accent: '#76b900' },
  },
  {
    id: 'gpu-2060', name: 'NVIDIA GeForce RTX 2060 6GB', brand: 'NVIDIA', year: 2019, tier: 'basica', price: 1000,
    desc: 'A primeira geração com Ray Tracing e DLSS. Ainda roda bem muitos jogos em 1080p.',
    specs: { vram: 6, cores: 1920, boostMHz: 1680, tdp: 160, lengthCM: 23, slots: 2, fans: 2, rt: true, upscale: 'DLSS', idx: 62, power: '8' },
    look: { shroud: '#2b2d31', accent: '#76b900' },
  },
  {
    id: 'gpu-3050', name: 'NVIDIA GeForce RTX 3050 8GB', brand: 'NVIDIA', year: 2022, tier: 'basica', price: 1250,
    desc: 'Entrada da linha RTX 30. Roda jogos em 1080p no médio com DLSS.',
    specs: { vram: 8, cores: 2560, boostMHz: 1777, tdp: 130, lengthCM: 20, slots: 2, fans: 2, rt: true, upscale: 'DLSS', idx: 58, power: '8' },
    look: { shroud: '#1c1d20', accent: '#76b900' },
  },
  {
    id: 'gpu-rx6600', name: 'AMD Radeon RX 6600 8GB', brand: 'AMD', year: 2021, tier: 'intermediaria', price: 1300,
    desc: 'Excelente custo-benefício para jogar em 1080p no alto. Econômica.',
    specs: { vram: 8, cores: 1792, boostMHz: 2491, tdp: 132, lengthCM: 19, slots: 2, fans: 2, rt: true, upscale: 'FSR', idx: 86, power: '8' },
    look: { shroud: '#1e1f22', accent: '#d32f2f' },
  },
  {
    id: 'gpu-3060', name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'NVIDIA', year: 2021, tier: 'intermediaria', price: 1700,
    desc: '12GB de memória de vídeo, bom para jogos e para quem também quer usar IA e edição.',
    specs: { vram: 12, cores: 3584, boostMHz: 1777, tdp: 170, lengthCM: 24, slots: 2, fans: 2, rt: true, upscale: 'DLSS', idx: 82, power: '8' },
    look: { shroud: '#202125', accent: '#76b900' },
  },
  {
    id: 'gpu-4060', name: 'NVIDIA GeForce RTX 4060 8GB', brand: 'NVIDIA', year: 2023, tier: 'intermediaria', price: 1900,
    desc: 'Referência para 1080p: roda quase tudo no alto, consome pouca energia e tem DLSS 3 (gera quadros extras).',
    specs: { vram: 8, cores: 3072, boostMHz: 2460, tdp: 115, lengthCM: 20, slots: 2, fans: 2, rt: true, upscale: 'DLSS 3', idx: 100, power: '8' },
    look: { shroud: '#1b1c1f', accent: '#76b900' },
  },
  {
    id: 'gpu-b580', name: 'Intel Arc B580 12GB', brand: 'Intel', year: 2024, tier: 'intermediaria', price: 1900,
    desc: 'A aposta da Intel: 12GB de memória por um bom preço. Funciona melhor com processadores recentes.',
    specs: { vram: 12, cores: 2560, boostMHz: 2850, tdp: 190, lengthCM: 27, slots: 2, fans: 2, rt: true, upscale: 'XeSS', idx: 108, power: '8' },
    look: { shroud: '#e9eaec', accent: '#0068b5' },
  },
  {
    id: 'gpu-5060', name: 'NVIDIA GeForce RTX 5060 8GB', brand: 'NVIDIA', year: 2025, tier: 'intermediaria', price: 2300,
    desc: 'Geração mais nova com DLSS 4. Bem mais rápida que a 4060, mas os 8GB já limitam alguns jogos no ultra.',
    specs: { vram: 8, cores: 3840, boostMHz: 2497, tdp: 145, lengthCM: 22, slots: 2, fans: 2, rt: true, upscale: 'DLSS 4', idx: 122, power: '8' },
    look: { shroud: '#17181b', accent: '#76b900' },
  },
  {
    id: 'gpu-4070s', name: 'NVIDIA GeForce RTX 4070 Super 12GB', brand: 'NVIDIA', year: 2024, tier: 'avancada', price: 4500,
    desc: 'Ótima para 1440p (resolução 2K) no alto, com Ray Tracing e DLSS 3.',
    specs: { vram: 12, cores: 7168, boostMHz: 2475, tdp: 220, lengthCM: 27, slots: 2.5, fans: 3, rt: true, upscale: 'DLSS 3', idx: 172, power: '16' },
    look: { shroud: '#1d1e21', accent: '#76b900' },
  },
  {
    id: 'gpu-rx7800xt', name: 'AMD Radeon RX 7800 XT 16GB', brand: 'AMD', year: 2023, tier: 'avancada', price: 3600,
    desc: '16GB de memória de vídeo: aguenta jogos pesados em 1440p por muitos anos.',
    specs: { vram: 16, cores: 3840, boostMHz: 2430, tdp: 263, lengthCM: 27, slots: 2.5, fans: 3, rt: true, upscale: 'FSR', idx: 175, power: '2x8' },
    look: { shroud: '#141516', accent: '#d32f2f' },
  },
  {
    id: 'gpu-5070', name: 'NVIDIA GeForce RTX 5070 12GB', brand: 'NVIDIA', year: 2025, tier: 'avancada', price: 4300,
    desc: 'Alto desempenho em 1440p com DLSS 4 e geração de quadros múltipla.',
    specs: { vram: 12, cores: 6144, boostMHz: 2510, tdp: 250, lengthCM: 28, slots: 2.5, fans: 3, rt: true, upscale: 'DLSS 4', idx: 185, power: '16' },
    look: { shroud: '#1a1b1e', accent: '#76b900' },
  },
  {
    id: 'gpu-rx9070xt', name: 'AMD Radeon RX 9070 XT 16GB', brand: 'AMD', year: 2025, tier: 'topo', price: 5200,
    desc: 'A mais forte da AMD na geração RDNA 4, com FSR 4. Ótima em 1440p e boa em 4K.',
    specs: { vram: 16, cores: 4096, boostMHz: 2970, tdp: 304, lengthCM: 30, slots: 3, fans: 3, rt: true, upscale: 'FSR 4', idx: 230, power: '2x8' },
    look: { shroud: '#121314', accent: '#e53935' },
  },
  {
    id: 'gpu-5080', name: 'NVIDIA GeForce RTX 5080 16GB', brand: 'NVIDIA', year: 2025, tier: 'topo', price: 8500,
    desc: 'Para jogar em 4K com tudo no máximo usando DLSS 4.',
    specs: { vram: 16, cores: 10752, boostMHz: 2617, tdp: 360, lengthCM: 31, slots: 3, fans: 3, rt: true, upscale: 'DLSS 4', idx: 265, power: '16' },
    look: { shroud: '#2c2e31', accent: '#76b900' },
  },
  {
    id: 'gpu-4090', name: 'NVIDIA GeForce RTX 4090 24GB', brand: 'NVIDIA', year: 2022, tier: 'topo', price: 14000,
    desc: 'Foi a placa mais forte do mundo até 2025. Enorme (3,5 slots), consome até 450W.',
    specs: { vram: 24, cores: 16384, boostMHz: 2520, tdp: 450, lengthCM: 33.6, slots: 3.5, fans: 3, rt: true, upscale: 'DLSS 3', idx: 310, power: '16' },
    look: { shroud: '#2e3033', accent: '#76b900' },
  },
  {
    id: 'gpu-5090', name: 'NVIDIA GeForce RTX 5090 32GB', brand: 'NVIDIA', year: 2025, tier: 'topo', price: 20000,
    desc: 'A placa de vídeo mais poderosa para consumidores. 32GB de memória e 575W de consumo.',
    specs: { vram: 32, cores: 21760, boostMHz: 2407, tdp: 575, lengthCM: 35, slots: 3.5, fans: 3, rt: true, upscale: 'DLSS 4', idx: 400, power: '16' },
    look: { shroud: '#141517', accent: '#76b900' },
  },
]);

/* ------------------------------ VENTOINHAS ------------------------------ */
add('fan', [
  {
    id: 'fan-basic', name: 'Ventoinha 120mm Simples', brand: 'Genérica', year: 2018, tier: 'basica', price: 25,
    desc: 'Ventoinha preta básica de 12 cm. Melhora a circulação de ar dentro do gabinete.',
    specs: { size: 120, cfm: 40, rgb: false, noise: 26 }, look: { color: '#161616', blade: '#1e1e1e' },
  },
  {
    id: 'fan-argb', name: 'Ventoinha 120mm ARGB', brand: 'Rise Mode', year: 2022, tier: 'intermediaria', price: 50,
    desc: 'Com anel de luz RGB endereçável. Deixa o PC colorido e ajuda na refrigeração.',
    specs: { size: 120, cfm: 48, rgb: true, noise: 28 }, look: { color: '#111', blade: '#e9e9ec' },
  },
  {
    id: 'fan-noctua', name: 'Noctua NF-A12x25', brand: 'Noctua', year: 2018, tier: 'avancada', price: 200,
    desc: 'Considerada a melhor ventoinha de 12 cm: move muito ar fazendo pouco barulho.',
    specs: { size: 120, cfm: 60, rgb: false, noise: 22 }, look: { color: '#c8a98b', blade: '#6a4234' },
  },
]);

export const PARTS = P;
