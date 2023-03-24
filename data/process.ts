import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { ProcessedTeam, Result } from '../src/models';

interface Tile {
  position: string;
  textures: string[];
}

interface Island {
  tiles: Tile[];
  radius: number;
}

interface Team {
  name: string;
}

interface RawRow {
  island: Island;
  teamId: number;
  profit: number;
  currentPlace: number;
  team: Team;
  worldPosition: string;
}

const processedTeams: Record<string, ProcessedTeam> = {};

const rawDirectory = path.resolve(process.cwd(), 'data/raw');
fs.readdirSync(rawDirectory)
  .sort((a, b) => a.localeCompare(b))
  .forEach(file => {
    const fullPath = path.resolve(rawDirectory, file);
    const content = fs.readFileSync(fullPath).toString();

    const round = parseInt(file.split('_ROUND')[1].split('.')[0]) - 1;

    const data: RawRow[] = JSON.parse(content);
    data.sort((a, b) => {
      if (a.profit == b.profit) {
        return a.team.name.toLowerCase().localeCompare(b.team.name.toLowerCase());
      }

      return b.profit - a.profit;
    });

    let jointRank = 0;
    let jointProfit: number | null = null;
    let nextJointRank = 1;

    for (const row of data) {
      if (row.profit !== jointProfit) {
        jointRank = nextJointRank;
        jointProfit = row.profit;
      }

      nextJointRank += 1;

      const roundResult: Result = {
        officialRank: row.currentPlace,
        jointRank,
        profit: row.profit,
      };

      if (processedTeams[row.teamId] === undefined) {
        processedTeams[row.teamId] = {
          team: row.team.name,
          results: { [round]: roundResult },
        };
      } else {
        processedTeams[row.teamId].results[round] = roundResult;
      }
    }
  });

const processedFile = path.resolve(process.cwd(), 'data/processed.json');
fs.writeFileSync(processedFile, JSON.stringify(processedTeams));
