import { reactive, effect, computed } from './reactivity'

// 把数据进行proxy代理
const data = { name: 'Gourdbaby', arr: [1,2,3] }
const state = reactive(data)  // return Proxy {name: "Gourdbaby", arr: Array(3)}

const myName = computed(() => { // 首先可以肯定的是 computed 也是基于effect的，和vue2一样，可以传函数，可以传对象，传对象就需要，get,set方法
  console.log('ok') 
  return state.name + 'minxiang.sun'
})

effect(function(){
  // console.log(state.name)
  console.log(myName.value)
  // computed默认不执行 只有在取computed的值的时候才会执行
  // 可以看到 如果隐藏 console.log(myName.value) 这句话，computed里的 consle.log('ok')并不会打印
  // 计算属性有缓存机制，多次取值也只执行一次
})


// state.name = 'Gourdbaby is progressing'