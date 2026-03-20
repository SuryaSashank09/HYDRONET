export const STATUS_LABELS = {
  functional:        'Functional',
  needs_repair:      'Needs Repair',
  non_functional:    'Non-Functional',
  under_maintenance: 'Under Maintenance',
};

export const STATUS_BADGE = {
  functional:        'badge-functional',
  needs_repair:      'badge-repair',
  non_functional:    'badge-nonfunctional',
  under_maintenance: 'badge-maintenance',
};

export const STATUS_DOT = {
  functional:        '#10b981',
  needs_repair:      '#f59e0b',
  non_functional:    '#f43f5e',
  under_maintenance: '#8b5cf6',
};

export const TYPE_LABELS = {
  rooftop_tank:    'Rooftop Tank',
  check_dam:       'Check Dam',
  percolation_pit: 'Percolation Pit',
  recharge_well:   'Recharge Well',
  pond:            'Pond',
  sump:            'Sump',
  other:           'Other',
};

export const TYPE_ICONS = {
  rooftop_tank:    '🏠',
  check_dam:       '🌊',
  percolation_pit: '⬇️',
  recharge_well:   '💧',
  pond:            '🏞️',
  sump:            '🛢️',
  other:           '📍',
};

export const RANK_COLORS = {
  Seedling:  '#10b981',
  Sapling:   '#0ea5e9',
  Guardian:  '#8b5cf6',
  Champion:  '#f59e0b',
  Legend:    '#f43f5e',
};

export const RANK_ICONS = {
  Seedling:  '🌱',
  Sapling:   '🌿',
  Guardian:  '🛡️',
  Champion:  '🏆',
  Legend:    '⭐',
};

export const formatNumber = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 30)   return `${days}d ago`;
  return formatDate(d);
};

export const severityColor = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#f43f5e',
};
