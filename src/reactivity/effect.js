function effect (fn, options = {}){
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) { // 这个lazy是配合computed方法的，也就是 如果是computed就不立即执行， 默认是立即执行effect函数
    effect(); // 默认就要执行
  }
  return effect
}


let activeEffect; // 记录当前执行的effect
const effectStack = []; // 栈结构

function createReactiveEffect(fn, options){
  const effect = function reactiveEffect(){
    if(!effectStack.includes(effect)){ // 防止不停的更改属性导致死循环
      try{
        effectStack.push(effect) 
        activeEffect = effect // 保存当前执行的effect 依赖收集的时候会用到
        return fn()
      } finally {
        effectStack.pop() // 栈结构 先进后出 从数组末尾删
        activeEffect = effectStack[effectStack.length - 1] // 这里应该是空的， 相当于执行完传进来的fn后就要清除 activeEffect
      }
    }
  }

  effect.options = options // 把传进来的配置条件放在当前执行的effect上，目前主要是配合computed使用，会在computed中详细解释

  return effect
}

const targetMap = new WeakMap() // 维护一个WeakMap 来存储proxy代理的对象的每一个属性所依赖的effect，当进行修改操作的时候方便找到对应的effect执行
function track (target, type, key){
  if(!activeEffect) return // 如果activeEffect没有值 说明没有当前获取操作不依赖于effect

  let depsMap = targetMap.get(target)
  if(!depsMap){
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if(!dep){
    depsMap.set(key, (dep = new Set())) // Set用来存储effect，保证值的唯一性
  }

  if(!dep.has(activeEffect)){
    dep.add(activeEffect) // 最终收集依赖
  }

  // 这里简单描述一下最终 targetMap 的样子，方便理解，这里我们传进来的对象是 { name: 'Gourdbaby', arr: [1,2,3] }，经过处理后 假设当前取值的key = name 的话，targetMap中存储的数据会是如下样子：

  // {
  //   { name: 'Gourdbaby', arr: [1,2,3] } : { name: Set(effect) } 
  // }

}

function trigger (target, type, key, value){
  const depsMap = targetMap.get(target)
  if(!depsMap) return //现获取当前设置的目标对象在 targetMap 中有没有保存，没有的话就是不依赖 什么都不做

  const effects = new Set()  // 存储普通的effect
  const computedEffect = new Set() // 存储computed类型的effect，分开存储的目的是，computed永远会先于effect执行

  const add = (effectsToAdd) => {
    if (effectsToAdd) {
        effectsToAdd.forEach(effect => {
            if (effect.options.computed) {
              computedEffect.add(effect)
            } else {
              effects.add(effect)
            }
        })
    }
  }

  if (key !== null) { // 获取在track函数中存好的effect
    add(depsMap.get(key))
  }
  if (type === 'ADD') { // 对数组新增属性 会触发length 对应的依赖 在取值的时候回对length属性进行依赖收集
    add(depsMap.get(Array.isArray(target) ? 'length' : ''))
  }
  const run = (effect) => {
    if (effect.options.scheduler) {
        effect.options.scheduler() // computed effect会执行scheduler函数 这个在computed中会详细描述
    } else {
        effect() // 执行取到effect
    }
  }

  computedEffect.forEach(run)
  effects.forEach(run)

}



export {
  effect, track, trigger
}