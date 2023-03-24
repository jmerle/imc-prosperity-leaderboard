export interface Result {
  rank: number | null;
  profit: number;
}

export interface ProcessedTeam {
  team: string;
  results: Record<string, Result>;
}
