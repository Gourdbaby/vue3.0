import { reactive, effect } from './reactivity'

// 把数据进行proxy代理
const data = { name: 'Gourdbaby', arr: [1,2,3] }
const state = reactive(data)  // return Proxy {name: "Gourdbaby", arr: Array(3)}


effect(function(){
  console.log(state.name)
})

state.name = 'Gourdbaby is progressing'