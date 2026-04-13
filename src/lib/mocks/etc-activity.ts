import type { ETCActivity, ETCWallet } from '../../types/domain'

const recentActivity: ETCActivity[] = [
  {
    date: '2026-04-12',
    tollStation: 'Thu Duc Toll Plaza',
    amountVnd: 35000,
    direction: 'HCMC → Bien Hoa',
  },
  {
    date: '2026-04-11',
    tollStation: 'Thu Duc Toll Plaza',
    amountVnd: 35000,
    direction: 'Bien Hoa → HCMC',
  },
  {
    date: '2026-04-10',
    tollStation: 'Saigon Bridge Toll',
    amountVnd: 20000,
    direction: 'District 2 → Thu Duc',
  },
  {
    date: '2026-04-09',
    tollStation: 'Saigon Bridge Toll',
    amountVnd: 20000,
    direction: 'Thu Duc → District 2',
  },
  {
    date: '2026-04-08',
    tollStation: 'Long Thanh Expressway',
    amountVnd: 80000,
    direction: 'HCMC → Long Thanh',
  },
  {
    date: '2026-04-07',
    tollStation: 'Long Thanh Expressway',
    amountVnd: 80000,
    direction: 'Long Thanh → HCMC',
  },
  {
    date: '2026-04-06',
    tollStation: 'Thu Duc Toll Plaza',
    amountVnd: 35000,
    direction: 'HCMC → Bien Hoa',
  },
]

export const etcWallet: ETCWallet = {
  balanceVnd: 485000,
  recentActivity,
}
