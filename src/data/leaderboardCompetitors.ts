export type LeaderboardCity = 'Almaty' | 'Shchuchinsk' | 'Astana'

export interface LeaderboardEntry {
  id: string
  name: string
  elo: number
  wins: number
  city: LeaderboardCity
  country: 'Kazakhstan'
}

/** Programmatic regional pool — 15 top competitors across KZ hubs */
export const REGIONAL_COMPETITORS: LeaderboardEntry[] = [
  { id: 'lb-01', name: 'AlmatyGrandmaster', elo: 2142, wins: 892, city: 'Almaty', country: 'Kazakhstan' },
  { id: 'lb-02', name: 'AstanaTactician', elo: 2089, wins: 756, city: 'Astana', country: 'Kazakhstan' },
  { id: 'lb-03', name: 'ShchuBlitzKing', elo: 2034, wins: 701, city: 'Shchuchinsk', country: 'Kazakhstan' },
  { id: 'lb-04', name: 'SteppeStrategist', elo: 1987, wins: 654, city: 'Almaty', country: 'Kazakhstan' },
  { id: 'lb-05', name: 'NomadFlyer', elo: 1955, wins: 612, city: 'Astana', country: 'Kazakhstan' },
  { id: 'lb-06', name: 'BorovoeMaster', elo: 1920, wins: 580, city: 'Shchuchinsk', country: 'Kazakhstan' },
  { id: 'lb-07', name: 'MedeuRapid', elo: 1898, wins: 541, city: 'Almaty', country: 'Kazakhstan' },
  { id: 'lb-08', name: 'EsilDamka', elo: 1875, wins: 498, city: 'Astana', country: 'Kazakhstan' },
  { id: 'lb-09', name: 'KokshetauCrown', elo: 1855, wins: 467, city: 'Shchuchinsk', country: 'Kazakhstan' },
  { id: 'lb-10', name: 'DostykDefender', elo: 1832, wins: 430, city: 'Almaty', country: 'Kazakhstan' },
  { id: 'lb-11', name: 'LeftBankFlyer', elo: 1810, wins: 401, city: 'Astana', country: 'Kazakhstan' },
  { id: 'lb-12', name: 'BurabayBlitzer', elo: 1788, wins: 372, city: 'Shchuchinsk', country: 'Kazakhstan' },
  { id: 'lb-13', name: 'SamalSquare', elo: 1765, wins: 348, city: 'Almaty', country: 'Kazakhstan' },
  { id: 'lb-14', name: 'NurlyZhol', elo: 1742, wins: 320, city: 'Astana', country: 'Kazakhstan' },
  { id: 'lb-15', name: 'AkkolAce', elo: 1720, wins: 295, city: 'Shchuchinsk', country: 'Kazakhstan' },
]

export type LeaderboardTab = 'global' | LeaderboardCity

export function buildLeaderboard(
  competitors: LeaderboardEntry[],
  currentUser?: {
    displayName: string
    elo: number
    wins: number
    city: string
  } | null,
  tab: LeaderboardTab = 'global',
  search = '',
): (LeaderboardEntry & { rank: number; isYou?: boolean })[] {
  let pool = [...competitors]

  if (currentUser) {
    const city = currentUser.city as LeaderboardCity
    const validCity =
      city === 'Almaty' || city === 'Shchuchinsk' || city === 'Astana'
        ? city
        : 'Almaty'
    pool = pool.filter((e) => e.name !== currentUser.displayName)
    pool.push({
      id: 'you',
      name: currentUser.displayName,
      elo: currentUser.elo,
      wins: currentUser.wins,
      city: validCity,
      country: 'Kazakhstan',
    })
  }

  if (tab !== 'global') {
    pool = pool.filter((e) => e.city === tab)
  }

  const q = search.trim().toLowerCase()
  if (q) {
    pool = pool.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q),
    )
  }

  pool.sort((a, b) => b.elo - a.elo)

  return pool.map((e, i) => ({
    ...e,
    rank: i + 1,
    isYou: e.id === 'you',
  }))
}
