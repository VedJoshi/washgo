export function formatKilometers(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} km`
}
