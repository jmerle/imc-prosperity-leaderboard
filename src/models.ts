export interface Result {
  officialRank: number | null;
  jointRank: number;
  profit: number;
}

export interface ProcessedTeam {
  team: string;
  results: Record<string, Result>;
}
