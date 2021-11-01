const STATE = {
  CLEAR: 0,
  WAITING: -1  
}
const OP_TYPE = {
  INSERT: 0,
  DELETE: 1,
  NOOP: -1
}
const SPECIAL_KEYS = ['Alt', 'Shift', 'Meta', 'Control', 'CapsLock', 'Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']


export {STATE, OP_TYPE, SPECIAL_KEYS}