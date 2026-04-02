// =============================================================================
// Team brand colors — optimized for dark background legibility
// =============================================================================

export const TEAM_COLORS: Record<string, string> = {
  'Chelsea':           '#D4AF37',  // Chelsea gold (dashboard accent)
  'Arsenal':           '#EF0107',  // Arsenal red
  'Liverpool':         '#C8102E',  // Liverpool crimson
  'Manchester City':   '#6CABDD',  // City sky blue
  'Manchester United': '#DA291C',  // United red (darker than Arsenal)
  'Tottenham':         '#E8E8E8',  // Spurs white (Lilywhites)
  'Newcastle United':  '#99A1A8',  // Newcastle silver/grey
  'Aston Villa':       '#95BFE5',  // Villa light blue (secondary)
  'Brighton':          '#0057B8',  // Brighton blue
  'Nottingham Forest': '#DD0000',  // Forest red
  'Brentford':         '#E30613',  // Brentford red
  'West Ham':          '#7A263A',  // West Ham claret
  'Fulham':            '#CC0000',  // Fulham red
  'Everton':           '#003399',  // Everton royal blue
  'Bournemouth':       '#DA291C',  // Bournemouth red
  'Crystal Palace':    '#C4122E',  // Palace red
  'Wolves':            '#FDB913',  // Wolves gold
  'Wolverhampton Wanderers': '#FDB913',
  'Leicester City':    '#003090',  // Leicester blue
  'Leeds United':      '#FFCD00',  // Leeds yellow
  'Sunderland':        '#EB172B',  // Sunderland red
};

export function teamColor(name: string, fallbackIndex = 0): string {
  const fallbacks = ['#94A3B8', '#7EC8C8', '#6EE7B7', '#FCA5A5', '#C4B5FD'];
  return TEAM_COLORS[name] ?? fallbacks[fallbackIndex % fallbacks.length];
}
