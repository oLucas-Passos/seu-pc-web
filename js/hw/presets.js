// PCs de exemplo, montados automaticamente para explorar os resultados.
export const PRESETS = [
  {
    id: 'escritorio', name: 'PC de escritório', desc: 'Barato e rápido para estudo, Office e internet. Sem placa de vídeo.',
    parts: { case: 'case-basico', psu: 'psu-450b', mobo: 'mb-b760d4', cpu: 'cpu-i3-12100', cooler: 'cool-box', ram: ['ram-d4-8', 'ram-d4-8'], storage: ['nvme-sn350'] },
  },
  {
    id: 'entrada', name: 'Gamer de entrada', desc: 'Ryzen 5 5600 com RX 6600: o clássico custo-benefício para jogar em 1080p.',
    parts: { case: 'case-basico', psu: 'psu-550b', mobo: 'mb-b450', cpu: 'cpu-r5-5600', cooler: 'cool-box', gpu: 'gpu-rx6600', ram: ['ram-d4-8', 'ram-d4-8'], storage: ['nvme-nv3'], fans: ['fan-basic'] },
  },
  {
    id: 'intermediario', name: 'Gamer intermediário', desc: 'Plataforma AM5 com DDR5 e RTX 5060: jogos atuais no alto.',
    parts: { case: 'case-airflow', psu: 'psu-650b', mobo: 'mb-b650m', cpu: 'cpu-r5-7600', cooler: 'cool-ak400', gpu: 'gpu-5060', ram: ['ram-d5-16', 'ram-d5-16'], storage: ['nvme-nv3'] },
  },
  {
    id: 'itx', name: 'Compacto ITX', desc: 'PC pequeno e forte, cabe ao lado da TV.',
    parts: { case: 'case-itx', psu: 'psu-750g', mobo: 'mb-b650i', cpu: 'cpu-r7-7800x3d', cooler: 'cool-aio240', gpu: 'gpu-4070s', ram: ['ram-d5-16rgb', 'ram-d5-16rgb'], storage: ['nvme-990pro'] },
  },
  {
    id: 'edicao', name: 'Estação de edição', desc: 'Muitos núcleos, 128 GB de RAM e RTX 5080 para vídeo 4K e 3D.',
    parts: { case: 'case-north', psu: 'psu-1000g', mobo: 'mb-z890', cpu: 'cpu-u7-265k', cooler: 'cool-aio360', gpu: 'gpu-5080', ram: ['ram-d5-32rgb', 'ram-d5-32rgb', 'ram-d5-32rgb', 'ram-d5-32rgb'], storage: ['nvme-990pro', 'hdd-2tb'] },
  },
  {
    id: 'top', name: 'Gamer topo de linha', desc: 'Ryzen 7 9800X3D e RTX 5090 num gabinete aquário com RGB.',
    parts: { case: 'case-aquario', psu: 'psu-1000g', mobo: 'mb-x870e', cpu: 'cpu-r7-9800x3d', cooler: 'cool-aio360', gpu: 'gpu-5090', ram: ['ram-d5-32rgb', 'ram-d5-32rgb'], storage: ['nvme-t705'], fans: ['fan-argb'] },
  },
  {
    id: 'antigo', name: 'PC antigo (2012)', desc: 'Core i5 de 2ª geração, HD mecânico e fonte genérica. Veja o que ainda roda.',
    parts: { case: 'case-bege', psu: 'psu-gen500', mobo: 'mb-h61', cpu: 'cpu-i5-2400', cooler: 'cool-box', gpu: 'gpu-750ti', ram: ['ram-d3-4', 'ram-d3-4'], storage: ['hdd-1tb'] },
  },
];
