// Ícones de linha para cada tipo de peça (usados no site e na montagem).
const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

export const PART_ICONS = {
  case: `<svg viewBox="0 0 32 32" ${S}><rect x="8" y="3" width="16" height="26" rx="2"/><path d="M11 7h10M11 10h10"/><circle cx="16" cy="22" r="2.5"/></svg>`,
  mobo: `<svg viewBox="0 0 32 32" ${S}><rect x="4" y="4" width="24" height="24" rx="1.5"/><rect x="10" y="8" width="7" height="7"/><path d="M21 7v11M23.5 7v11M8 21h12M8 24h8"/><path d="M5 8h3M5 12h3"/></svg>`,
  cpu: `<svg viewBox="0 0 32 32" ${S}><rect x="8" y="8" width="16" height="16" rx="1.5"/><rect x="12" y="12" width="8" height="8" rx="1"/><path d="M12 4v4M16 4v4M20 4v4M12 24v4M16 24v4M20 24v4M4 12h4M4 16h4M4 20h4M24 12h4M24 16h4M24 20h4"/></svg>`,
  cooler: `<svg viewBox="0 0 32 32" ${S}><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="2.5"/><path d="M16 13.5c0-4 2-6.5 5-7M18.4 16.8c3.5 2 4.6 5 3.8 8M13.6 16.8c-3.5 2-6.6 1.6-8.4-.8"/></svg>`,
  ram: `<svg viewBox="0 0 32 32" ${S}><rect x="3" y="10" width="26" height="11" rx="1"/><path d="M7 14h4v3H7zM14 14h4v3h-4zM21 14h4v3h-4z"/><path d="M5 21v3M9 21v3M13 21v3M19 21v3M23 21v3M27 21v3"/></svg>`,
  gpu: `<svg viewBox="0 0 32 32" ${S}><rect x="3" y="8" width="26" height="14" rx="2"/><circle cx="11" cy="15" r="4"/><circle cx="21" cy="15" r="4"/><path d="M6 22v3h9v-3"/></svg>`,
  storage: `<svg viewBox="0 0 32 32" ${S}><rect x="3" y="11" width="26" height="10" rx="1.5"/><path d="M7 15h7M7 18h4"/><circle cx="24" cy="16" r="1.4"/><path d="M27 13v6"/></svg>`,
  psu: `<svg viewBox="0 0 32 32" ${S}><rect x="4" y="7" width="24" height="18" rx="2"/><circle cx="13" cy="16" r="5"/><path d="M13 11v10M8 16h10"/><path d="M22 12v3l-1.5 2H23l-1.5 3"/></svg>`,
  fan: `<svg viewBox="0 0 32 32" ${S}><rect x="4" y="4" width="24" height="24" rx="3"/><circle cx="16" cy="16" r="9"/><circle cx="16" cy="16" r="2"/><path d="M16 14c-.5-3 1-5 3.5-5.5M18 17c3 .6 4.4 2.6 4 5M14.2 17c-2 2.3-4.4 2.6-6.2 1.2"/></svg>`,
};

export function partIcon(cat) {
  const span = document.createElement('span');
  span.innerHTML = PART_ICONS[cat] || PART_ICONS.case;
  const svg = span.firstElementChild;
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}
