
import { isObject, hasOwn, hasChanged } from '../shared/utils'
import { reactive } from './reactive'

function get (target, key, receiver){
  const res = Reflect.get(target, key, receiver) // feel as target[key] as

  if(isObject(res)){
    return reactive(res) // If Object return proxy; recursion;
  }
  
  return res // else return valueOf
}

function set (target, key, value, receiver){
  const hadKey = hasOwn(target, key) // Judged if target has keyed
  const oldVal = target[key] // save old value
  const result = Reflect.set(target, key, value, receiver) // feel as target[key] = value as

  if(!hadKey){ // Expression add
    trigger(target, 'ADD', key, value)
  }else if(hasChanged(oldVal, value)){ // if changed
    trigger(target, 'SET', key, value)
  }

  return result
}

export default { get, set }