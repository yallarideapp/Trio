// Battery measurements belong to an individual device option. An absent value
// means unknown; zero is a supplied measurement and must survive persistence.
export function validBatteryHealth(value) {
  return value === undefined || value === null || (Number.isInteger(value) && value >= 0 && value <= 100);
}

export function validBatteryCycles(value) {
  return value === undefined || value === null || (Number.isSafeInteger(value) && value >= 0);
}
