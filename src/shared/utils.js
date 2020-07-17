export const isObject = (value) => typeof value === 'object'

export const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key)

export const hasChanged = (oldVal, value) => oldVal !== value