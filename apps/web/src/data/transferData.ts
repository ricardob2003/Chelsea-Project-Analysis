export type Season = '2024/25' | '2023/24' | '2022/23' | '2021/22' | '2020/21' | '2019/20';

export const SEASONS: Season[] = ['2024/25', '2023/24', '2022/23', '2021/22', '2020/21', '2019/20'];

export interface Transfer {
  name: string;
  position: string;
  type: 'in' | 'out';
  fee: string; // estimated
  feeNumeric: number; // in millions for totals
  from?: string;
  to?: string;
  imageUrl: string; // player face placeholder
}

export interface SeasonTransfers {
  season: Season;
  transfers: Transfer[];
  totalSpent: number;
  totalReceived: number;
}

export const transfersBySeason: SeasonTransfers[] = [
  {
    season: '2024/25',
    totalSpent: 210,
    totalReceived: 55,
    transfers: [
      { name: 'P. Neto', position: 'LW', type: 'in', fee: '£54M', feeNumeric: 54, from: 'Wolves', imageUrl: 'https://ui-avatars.com/api/?name=P+Neto&background=034694&color=fff&size=80' },
      { name: 'J. Dewsbury-Hall', position: 'CM', type: 'in', fee: '£30M', feeNumeric: 30, from: 'Leicester', imageUrl: 'https://ui-avatars.com/api/?name=J+DH&background=034694&color=fff&size=80' },
      { name: 'K. Kellyman', position: 'CM', type: 'in', fee: '£19M', feeNumeric: 19, from: 'Aston Villa', imageUrl: 'https://ui-avatars.com/api/?name=K+Kellyman&background=034694&color=fff&size=80' },
      { name: 'F. Veiga', position: 'LB', type: 'in', fee: '£12M', feeNumeric: 12, from: 'Basel', imageUrl: 'https://ui-avatars.com/api/?name=F+Veiga&background=034694&color=fff&size=80' },
      { name: 'M. Guiu', position: 'ST', type: 'in', fee: '£5M', feeNumeric: 5, from: 'Barcelona', imageUrl: 'https://ui-avatars.com/api/?name=M+Guiu&background=034694&color=fff&size=80' },
      { name: 'C. Gallagher', position: 'CM', type: 'out', fee: '£34M', feeNumeric: 34, to: 'Atlético Madrid', imageUrl: 'https://ui-avatars.com/api/?name=C+Gallagher&background=8B0000&color=fff&size=80' },
      { name: 'I. Sarr', position: 'CB', type: 'out', fee: '£12M', feeNumeric: 12, to: 'Nice', imageUrl: 'https://ui-avatars.com/api/?name=I+Sarr&background=8B0000&color=fff&size=80' },
      { name: 'L. Hall', position: 'GK', type: 'out', fee: '£9M', feeNumeric: 9, to: 'Cruz Azul', imageUrl: 'https://ui-avatars.com/api/?name=L+Hall&background=8B0000&color=fff&size=80' },
    ],
  },
  {
    season: '2023/24',
    totalSpent: 430,
    totalReceived: 65,
    transfers: [
      { name: 'M. Caicedo', position: 'CM', type: 'in', fee: '£115M', feeNumeric: 115, from: 'Brighton', imageUrl: 'https://ui-avatars.com/api/?name=M+Caicedo&background=034694&color=fff&size=80' },
      { name: 'C. Palmer', position: 'RW', type: 'in', fee: '£40M', feeNumeric: 40, from: 'Man City', imageUrl: 'https://ui-avatars.com/api/?name=C+Palmer&background=034694&color=fff&size=80' },
      { name: 'C. Nkunku', position: 'ST', type: 'in', fee: '£52M', feeNumeric: 52, from: 'RB Leipzig', imageUrl: 'https://ui-avatars.com/api/?name=C+Nkunku&background=034694&color=fff&size=80' },
      { name: 'R. Lavia', position: 'DM', type: 'in', fee: '£58M', feeNumeric: 58, from: 'Southampton', imageUrl: 'https://ui-avatars.com/api/?name=R+Lavia&background=034694&color=fff&size=80' },
      { name: 'N. Jackson', position: 'ST', type: 'in', fee: '£32M', feeNumeric: 32, from: 'Villarreal', imageUrl: 'https://ui-avatars.com/api/?name=N+Jackson&background=034694&color=fff&size=80' },
      { name: 'M. Mudryk', position: 'LW', type: 'in', fee: '£62M', feeNumeric: 62, from: 'Shakhtar', imageUrl: 'https://ui-avatars.com/api/?name=M+Mudryk&background=034694&color=fff&size=80' },
      { name: 'M. Gusto', position: 'RB', type: 'in', fee: '£30M', feeNumeric: 30, from: 'Lyon', imageUrl: 'https://ui-avatars.com/api/?name=M+Gusto&background=034694&color=fff&size=80' },
      { name: 'K. Havertz', position: 'ST', type: 'out', fee: '£65M', feeNumeric: 65, to: 'Arsenal', imageUrl: 'https://ui-avatars.com/api/?name=K+Havertz&background=8B0000&color=fff&size=80' },
    ],
  },
  {
    season: '2022/23',
    totalSpent: 323,
    totalReceived: 40,
    transfers: [
      { name: 'E. Fernández', position: 'CM', type: 'in', fee: '£107M', feeNumeric: 107, from: 'Benfica', imageUrl: 'https://ui-avatars.com/api/?name=E+Fernandez&background=034694&color=fff&size=80' },
      { name: 'M. Mudryk', position: 'LW', type: 'in', fee: '£62M', feeNumeric: 62, from: 'Shakhtar', imageUrl: 'https://ui-avatars.com/api/?name=M+Mudryk&background=034694&color=fff&size=80' },
      { name: 'B. Badiashile', position: 'CB', type: 'in', fee: '£35M', feeNumeric: 35, from: 'Monaco', imageUrl: 'https://ui-avatars.com/api/?name=B+Badiashile&background=034694&color=fff&size=80' },
      { name: 'N. Madueke', position: 'RW', type: 'in', fee: '£29M', feeNumeric: 29, from: 'PSV', imageUrl: 'https://ui-avatars.com/api/?name=N+Madueke&background=034694&color=fff&size=80' },
      { name: 'W. Fofana', position: 'CB', type: 'in', fee: '£70M', feeNumeric: 70, from: 'Leicester', imageUrl: 'https://ui-avatars.com/api/?name=W+Fofana&background=034694&color=fff&size=80' },
      { name: 'J. Félix', position: 'ST', type: 'in', fee: 'Loan', feeNumeric: 10, from: 'Atlético', imageUrl: 'https://ui-avatars.com/api/?name=J+Felix&background=034694&color=fff&size=80' },
      { name: 'C. Pulisic', position: 'RW', type: 'out', fee: '£19M', feeNumeric: 19, to: 'AC Milan', imageUrl: 'https://ui-avatars.com/api/?name=C+Pulisic&background=8B0000&color=fff&size=80' },
      { name: 'M. Kovačić', position: 'CM', type: 'out', fee: '£21M', feeNumeric: 21, to: 'Man City', imageUrl: 'https://ui-avatars.com/api/?name=M+Kovacic&background=8B0000&color=fff&size=80' },
    ],
  },
  {
    season: '2021/22',
    totalSpent: 117,
    totalReceived: 105,
    transfers: [
      { name: 'R. Lukaku', position: 'ST', type: 'in', fee: '£97.5M', feeNumeric: 97, from: 'Inter Milan', imageUrl: 'https://ui-avatars.com/api/?name=R+Lukaku&background=034694&color=fff&size=80' },
      { name: 'M. Saúl', position: 'CM', type: 'in', fee: 'Loan', feeNumeric: 5, from: 'Atlético', imageUrl: 'https://ui-avatars.com/api/?name=M+Saul&background=034694&color=fff&size=80' },
      { name: 'T. Abraham', position: 'ST', type: 'out', fee: '£34M', feeNumeric: 34, to: 'Roma', imageUrl: 'https://ui-avatars.com/api/?name=T+Abraham&background=8B0000&color=fff&size=80' },
      { name: 'O. Giroud', position: 'ST', type: 'out', fee: '£1M', feeNumeric: 1, to: 'AC Milan', imageUrl: 'https://ui-avatars.com/api/?name=O+Giroud&background=8B0000&color=fff&size=80' },
      { name: 'F. Tomori', position: 'CB', type: 'out', fee: '£25M', feeNumeric: 25, to: 'AC Milan', imageUrl: 'https://ui-avatars.com/api/?name=F+Tomori&background=8B0000&color=fff&size=80' },
      { name: 'K. Zouma', position: 'CB', type: 'out', fee: '£29.8M', feeNumeric: 30, to: 'West Ham', imageUrl: 'https://ui-avatars.com/api/?name=K+Zouma&background=8B0000&color=fff&size=80' },
    ],
  },
  {
    season: '2020/21',
    totalSpent: 222,
    totalReceived: 48,
    transfers: [
      { name: 'K. Havertz', position: 'AM', type: 'in', fee: '£72M', feeNumeric: 72, from: 'Leverkusen', imageUrl: 'https://ui-avatars.com/api/?name=K+Havertz&background=034694&color=fff&size=80' },
      { name: 'T. Werner', position: 'ST', type: 'in', fee: '£47.5M', feeNumeric: 47, from: 'RB Leipzig', imageUrl: 'https://ui-avatars.com/api/?name=T+Werner&background=034694&color=fff&size=80' },
      { name: 'B. Chilwell', position: 'LB', type: 'in', fee: '£50M', feeNumeric: 50, from: 'Leicester', imageUrl: 'https://ui-avatars.com/api/?name=B+Chilwell&background=034694&color=fff&size=80' },
      { name: 'E. Mendy', position: 'GK', type: 'in', fee: '£22M', feeNumeric: 22, from: 'Rennes', imageUrl: 'https://ui-avatars.com/api/?name=E+Mendy&background=034694&color=fff&size=80' },
      { name: 'T. Silva', position: 'CB', type: 'in', fee: 'Free', feeNumeric: 0, from: 'PSG', imageUrl: 'https://ui-avatars.com/api/?name=T+Silva&background=034694&color=fff&size=80' },
      { name: 'A. Morata', position: 'ST', type: 'out', fee: '£48M', feeNumeric: 48, to: 'Atlético', imageUrl: 'https://ui-avatars.com/api/?name=A+Morata&background=8B0000&color=fff&size=80' },
    ],
  },
  {
    season: '2019/20',
    totalSpent: 45,
    totalReceived: 150,
    transfers: [
      { name: 'H. Ziyech', position: 'RW', type: 'in', fee: '£33M', feeNumeric: 33, from: 'Ajax', imageUrl: 'https://ui-avatars.com/api/?name=H+Ziyech&background=034694&color=fff&size=80' },
      { name: 'M. Kovačić', position: 'CM', type: 'in', fee: '£12M', feeNumeric: 12, from: 'Real Madrid', imageUrl: 'https://ui-avatars.com/api/?name=M+Kovacic&background=034694&color=fff&size=80' },
      { name: 'E. Hazard', position: 'LW', type: 'out', fee: '£130M', feeNumeric: 130, to: 'Real Madrid', imageUrl: 'https://ui-avatars.com/api/?name=E+Hazard&background=8B0000&color=fff&size=80' },
      { name: 'D. Luiz', position: 'CB', type: 'out', fee: '£8M', feeNumeric: 8, to: 'Arsenal', imageUrl: 'https://ui-avatars.com/api/?name=D+Luiz&background=8B0000&color=fff&size=80' },
    ],
  },
];
