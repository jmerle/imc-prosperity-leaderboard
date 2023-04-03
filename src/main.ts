import './main.css';
import * as agGrid from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import _teamData from '../data/processed.json';
import { ProcessedTeam } from './models';

const teamData = _teamData as Record<string, ProcessedTeam>;

function deltaValue(current: number | null | undefined, previous: number | null | undefined): number | null {
  const hasCurrent = current !== null && current !== undefined;
  const hasPrevious = previous !== null && previous !== undefined;

  if (hasCurrent && hasPrevious) {
    return current - previous;
  } else if (hasCurrent) {
    return current;
  } else if (hasPrevious) {
    return -previous;
  } else {
    return null;
  }
}

function formatNumber(value: number, decimals: number = 0): string {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals > 0 ? decimals : 0,
    maximumFractionDigits: decimals > 0 ? decimals : 0,
  });
}

function createNumberFormatter(decimals: number): agGrid.ValueFormatterFunc {
  return params => {
    if (params.value === null) {
      return 'None';
    } else {
      return formatNumber(params.value, decimals);
    }
  };
}

function createDeltaFormatter(decimals: number): agGrid.ValueFormatterFunc {
  const numberFormatter = createNumberFormatter(decimals);

  return params => {
    if (params.value === null) {
      return numberFormatter(params);
    }

    const prefix = params.value > 0 ? '+' : '';
    return prefix + numberFormatter(params);
  };
}

const columns: agGrid.GridOptions['columnDefs'] = [];

const minRound = Math.min(...Object.values(teamData).map(team => Math.min(...Object.keys(team.results).map(Number))));
const maxRound = Math.max(...Object.values(teamData).map(team => Math.max(...Object.keys(team.results).map(Number))));

const numberComparator: agGrid.ColDef['comparator'] = (valueA, valueB, nodeA, nodeB, isDescending) => {
  if (valueA === valueB) {
    return 0;
  } else if (valueA !== null && valueB !== null) {
    return valueA - valueB;
  }

  if (isDescending) {
    return valueA === null ? -1 : 1;
  } else {
    return valueA === null ? 1 : -1;
  }
};

for (let i = maxRound; i >= minRound; i--) {
  const totalTeams = Object.values(teamData).filter(team => team.results[i]).length;
  const rankedTeams = Object.values(teamData).filter(team => team.results[i]?.rank).length;

  columns.push({
    headerName: `After Round ${i} • ${formatNumber(totalTeams)} unique teams • ${formatNumber(
      rankedTeams,
    )} ranked teams`,
    children: [
      {
        field: `round-${i}-rank`,
        headerName: 'Rank',
        valueFormatter: createNumberFormatter(0),
        comparator: numberComparator,
        sort: i === maxRound ? 'asc' : undefined,
        filter: 'agNumberColumnFilter',
      },
      {
        field: `round-${i}-rank-delta`,
        headerName: 'Rank Δ',
        valueFormatter: createDeltaFormatter(0),
        comparator: numberComparator,
        filter: 'agNumberColumnFilter',
      },
      {
        field: `round-${i}-team`,
        headerName: 'Team',
        filter: 'agTextColumnFilter',
      },
      {
        field: `round-${i}-profit`,
        headerName: 'Profit',
        valueFormatter: createNumberFormatter(2),
        comparator: numberComparator,
        filter: 'agNumberColumnFilter',
      },
      {
        field: `round-${i}-profit-delta`,
        headerName: 'Profit Δ',
        valueFormatter: createDeltaFormatter(2),
        comparator: numberComparator,
        filter: 'agNumberColumnFilter',
      },
    ],
  });
}

const rows: agGrid.GridOptions['rowData'] = [];

for (const team of Object.values(teamData)) {
  const row: Record<string, any> = {};

  for (let i = maxRound; i >= minRound; i--) {
    const result = team.results[i];
    const previousResult = team.results[i - 1];

    row[`round-${i}-rank`] = result ? result.rank : null;
    row[`round-${i}-rank-delta`] = deltaValue(previousResult?.rank, result?.rank);
    row[`round-${i}-team`] = team.team;
    row[`round-${i}-profit`] = result ? result.profit : null;
    row[`round-${i}-profit-delta`] = deltaValue(result?.profit, previousResult?.profit);
  }

  rows.push(row);
}

document.addEventListener('DOMContentLoaded', () => {
  const gridElem = document.querySelector<HTMLDivElement>('#grid')!;
  const gridOptions: agGrid.GridOptions = {
    defaultColDef: {
      sortable: true,
      suppressMovable: true,
    },
    columnDefs: columns,
    rowData: rows,
    enableCellTextSelection: true,
    suppressCellFocus: true,
    cacheQuickFilter: true,
  };

  new agGrid.Grid(gridElem, gridOptions);

  const searchElem = document.querySelector<HTMLInputElement>('#search')!;
  searchElem.addEventListener('input', () => {
    gridOptions.api?.setQuickFilter(searchElem.value);
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'f' && e.ctrlKey) {
      searchElem.focus();
      searchElem.select();
      e.preventDefault();
    }
  });
});
