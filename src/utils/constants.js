
export const RESOLUTION_TIME = {
  RELATIVE_FORMAT: 'y[Y] M[M] D[D] h[hrs] m[mins]',
  RELATIVE_LONG_FORMAT: 'y[ years] M[ months] D[ days] h[ hours] m[ minutes and] s[ seconds left]',
  ABSOLUTE_FORMAT: 'ddd, L LT',
}

export const OUTCOME_TYPES = {
  CATEGORICAL: 'CATEGORICAL',
  SCALAR: 'SCALAR',
}

export const ORACLE_TYPES = {
  ULTIMATE: 'ULTIMATE',
  CENTRALIZED: 'CENTRALIZED',
  BLOCK_DIFFICULTY: 'BLOCK_DIFFICULTY',
  REALITY_KEYS: 'REALITY_KEYS',
}

export const HEX_VALUE_REGEX = /(0x)?[0-9A-Fa-f]{40}/

export const COLOR_SCHEME_DEFAULT = [
  '#0be1b1', // green
  '#e01563', // red
  '#f2a00a', // orange
  '#6f6f6f', // gray
  '#0abcf2', // blue
  '#f20ae0', // pink
  '#e4f20a', // yellow
  '#73472c', // brown
]

export const TRANSACTION_STATUS = {
  RUNNING: 'RUNNING',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
  DONE: 'DONE',
}

export const TRANSACTION_COMPLETE_STATUS = {
  NO_ERROR: 'NO_ERROR',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
}