export interface KPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  unit?: string;
}

export interface PositionGap {
  position: string;
  shortName: string;
  currentRating: number;
  leagueBenchmark: number;
  targetRating: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  gapScore: number;
}

export interface RecruitmentTarget {
  position: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  kpiDeficit: string;
  suggestedProfile: string;
  estimatedCost: string;
}

export interface SquadPlayer {
  name: string;
  position: string;
  age: number;
  appearances: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
  xG?: number;
  xA?: number;
  passCompletion?: number;
}

export interface StrategicRecommendation {
  id: string;
  category: 'recruitment' | 'tactical' | 'development';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  kpis: string[];
}

export const kpiData: KPI[] = [
  { label: 'Squad Depth Index', value: '72', change: -4.2, changeLabel: 'vs last window', unit: '/100' },
  { label: 'Performance Gap Score', value: '18.3', change: 2.1, changeLabel: 'vs target', unit: 'pts' },
  { label: 'xG Overperformance', value: '+3.2', change: -1.8, changeLabel: 'regression risk', unit: 'xG' },
  { label: 'Wage-to-Output Ratio', value: '0.67', change: -0.12, changeLabel: 'vs league avg', unit: '' },
  { label: 'U-23 Minutes Share', value: '31%', change: 5.4, changeLabel: 'vs last season', unit: '' },
  { label: 'Transfer Efficiency', value: '0.82', change: 0.09, changeLabel: 'vs market avg', unit: '/1.0' },
];

export const positionGaps: PositionGap[] = [
  { position: 'Centre-Back', shortName: 'CB', currentRating: 68, leagueBenchmark: 78, targetRating: 82, priority: 'critical', gapScore: 14 },
  { position: 'Defensive Midfielder', shortName: 'DM', currentRating: 71, leagueBenchmark: 80, targetRating: 84, priority: 'critical', gapScore: 13 },
  { position: 'Right Wing-Back', shortName: 'RWB', currentRating: 73, leagueBenchmark: 76, targetRating: 80, priority: 'high', gapScore: 7 },
  { position: 'Striker', shortName: 'ST', currentRating: 75, leagueBenchmark: 79, targetRating: 83, priority: 'high', gapScore: 8 },
  { position: 'Left Winger', shortName: 'LW', currentRating: 78, leagueBenchmark: 77, targetRating: 82, priority: 'medium', gapScore: 4 },
  { position: 'Goalkeeper', shortName: 'GK', currentRating: 80, leagueBenchmark: 78, targetRating: 82, priority: 'low', gapScore: 2 },
  { position: 'Central Midfielder', shortName: 'CM', currentRating: 77, leagueBenchmark: 79, targetRating: 83, priority: 'medium', gapScore: 6 },
  { position: 'Left-Back', shortName: 'LB', currentRating: 76, leagueBenchmark: 75, targetRating: 80, priority: 'low', gapScore: 4 },
];

export const recruitmentTargets: RecruitmentTarget[] = [
  {
    position: 'Centre-Back',
    priority: 'critical',
    rationale: 'Aerial duel win rate 12% below top-4 average. Progressive passing from defence ranks 17th in PL.',
    kpiDeficit: 'Aerial duels: 52% (target: 64%), Prog. passes: 4.2/90 (target: 6.8/90)',
    suggestedProfile: 'Left-footed, ball-playing CB. Age 23-27. Top-5 league experience.',
    estimatedCost: '£45-65M',
  },
  {
    position: 'Defensive Midfielder',
    priority: 'critical',
    rationale: 'Midfield pressing intensity dropped 18% in final third of matches. No natural single-pivot option.',
    kpiDeficit: 'PPDA: 12.4 (target: 9.8), Interceptions: 1.4/90 (target: 2.1/90)',
    suggestedProfile: 'High-volume ball winner with distribution. Age 22-26.',
    estimatedCost: '£50-75M',
  },
  {
    position: 'Right Wing-Back',
    priority: 'high',
    rationale: 'Creativity from right channel 40% below left. Cross completion 22% vs 31% league avg for position.',
    kpiDeficit: 'Crosses completed: 22% (target: 30%), Chances created: 0.8/90 (target: 1.5/90)',
    suggestedProfile: 'Athletic, high-stamina profile. Strong 1v1 both ways. Age 21-26.',
    estimatedCost: '£30-50M',
  },
  {
    position: 'Striker',
    priority: 'high',
    rationale: 'Shot conversion 8.2% vs 12.5% top-4 average. Over-reliance on xG overperformance unsustainable.',
    kpiDeficit: 'Conversion: 8.2% (target: 12%), npxG/shot: 0.08 (target: 0.12)',
    suggestedProfile: 'Clinical finisher, strong in-box movement. Age 23-28. 15+ league goals track record.',
    estimatedCost: '£60-90M',
  },
];

export const squadPlayers: SquadPlayer[] = [
  { name: 'R. Sánchez', position: 'GK', age: 27, appearances: 28, rating: 7.1, trend: 'up', passCompletion: 82 },
  { name: 'M. Gusto', position: 'RB', age: 22, appearances: 31, rating: 6.9, trend: 'stable', passCompletion: 87 },
  { name: 'L. Colwill', position: 'CB', age: 22, appearances: 26, rating: 7.0, trend: 'up', passCompletion: 89 },
  { name: 'W. Fofana', position: 'CB', age: 24, appearances: 14, rating: 6.5, trend: 'down', passCompletion: 85 },
  { name: 'M. Cucurella', position: 'LB', age: 26, appearances: 33, rating: 6.8, trend: 'stable', passCompletion: 84 },
  { name: 'M. Caicedo', position: 'CM', age: 23, appearances: 30, rating: 7.3, trend: 'up', passCompletion: 88 },
  { name: 'E. Fernández', position: 'CM', age: 24, appearances: 32, rating: 7.1, trend: 'stable', xA: 0.15, passCompletion: 86 },
  { name: 'C. Palmer', position: 'RW', age: 23, appearances: 33, rating: 7.8, trend: 'up', xG: 0.42, xA: 0.28 },
  { name: 'N. Madueke', position: 'RW', age: 23, appearances: 29, rating: 7.0, trend: 'up', xG: 0.22, xA: 0.18 },
  { name: 'P. Neto', position: 'LW', age: 25, appearances: 24, rating: 6.7, trend: 'down', xG: 0.14, xA: 0.21 },
  { name: 'N. Jackson', position: 'ST', age: 24, appearances: 34, rating: 6.9, trend: 'stable', xG: 0.35 },
  { name: 'C. Nkunku', position: 'ST', age: 27, appearances: 18, rating: 7.0, trend: 'up', xG: 0.38, xA: 0.12 },
];

export const strategicRecommendations: StrategicRecommendation[] = [
  {
    id: '1',
    category: 'recruitment',
    title: 'Priority: Ball-Playing Centre-Back',
    description: 'Data indicates progressive passing from defence is a systemic weakness. A left-footed CB who ranks in the 80th+ percentile for progressive carries and passes would transform build-up patterns.',
    impact: 'high',
    confidence: 92,
    kpis: ['Progressive passes/90', 'Aerial duel %', 'Errors leading to shots'],
  },
  {
    id: '2',
    category: 'recruitment',
    title: 'Single Pivot DM Required',
    description: 'Current double-pivot limits attacking output. A press-resistant DM would free Caicedo/Fernández for advanced roles, projected to increase xG creation by 0.3/match.',
    impact: 'high',
    confidence: 88,
    kpis: ['PPDA', 'Pressure success %', 'Pass completion under pressure'],
  },
  {
    id: '3',
    category: 'tactical',
    title: 'Right-Channel Creativity Deficit',
    description: 'Attack is over-indexed on left channel (62% of chance creation). Recruiting a creative RWB or adjusting Palmer\'s positioning could balance offensive threat distribution.',
    impact: 'medium',
    confidence: 85,
    kpis: ['Chance creation by zone', 'Cross completion %', 'xA from right channel'],
  },
  {
    id: '4',
    category: 'development',
    title: 'Colwill Trajectory: Top-4 CB Potential',
    description: 'Progressive metrics trending +15% over 6 months. Investment in minutes and development pathway preferred over external CB signing for left-sided role.',
    impact: 'medium',
    confidence: 78,
    kpis: ['Progressive carries/90', 'Interceptions', 'Pass completion %'],
  },
  {
    id: '5',
    category: 'recruitment',
    title: 'Striker Conversion Sustainability Risk',
    description: 'Current strikers over-performing xG by +3.2. Historical regression models suggest 60% probability of decline. Clinical finisher acquisition is a hedge against regression.',
    impact: 'high',
    confidence: 82,
    kpis: ['npxG/shot', 'Shot conversion %', 'Box entries'],
  },
];
