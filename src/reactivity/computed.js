import { isFunction } from '../shared/utils'
import { effect, track, trigger } from './effect'

export function computed(getterOrOptions) { 
  let getter;
  let setter;
  
  if(isFunction){
    getter = getterOrOptions
    setter = () => {}
  }else{
    getter = getterOrOptions.get
    setter = getterOrOptions.set || (() => {})
  }

  let dirty = true // computed 实现缓存的变量，默认 true 执行getter方法，false就不执行

  let computed;

  let runner = effect(getter, {
    lazy: true, // effect函数会判断 如果lazy为真就不立即执行传进来的函数，只是返回一个effect
    computed: true, // 标识：告诉effect 当前执行的是一个computed
    scheduler: () => { // 计算属性依赖的值发生变化后，就会执行scheduler， scheduler把dirty变为true 就又可以执行runner函数
      if(!dirty){
        dirty = true
        trigger(computed, 'SET', 'value')
      }
    }
  })

  let value;

  computed = {  // vue2的写法 definePropotype
    get value(){
      if(dirty){ // 利用dirty控制 多次取值只执行一次 runner 函数
        value = runner() // 这里仔细看一下 effect的逻辑，此时执行ruuner实际上就会执行到  getter 函数，getter函数就是你调computed时传进来的函数
        dirty = false 
        track(computed, 'GET', 'value') // 依赖收集
      }
      return value
    },
    set value(newVal){
      setter(newVal)
    }
  }

  return computed
}