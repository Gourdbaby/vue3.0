# vue3.0
Learn vue 3.0
### Usage
  1. npm i
  2. npm run serve
  3. http://localhost:8080
### Realization vue3.0 reactive
index.js文件中引入 `reactive` 其接受一个对象，返回一个Proxy对象。
```
import { reactive } from './reactivity'

// 把数据进行proxy代理
const data = { name: 'Gourdbaby', arr: [1,2,3] }
const state = reactive(data)  // return Proxy {name: "Gourdbaby", arr: Array(3)}
```
`new Proxy(target, proxyHandler)` 接收两个参数，第一个是传进来的对象，第二个也是一个对象，两个属性`get` `set`，获取`state.name`触发`get`函数，`state.name=2`触发`set`函数
```
import proxyHandler from './baseHandler'

function reactive(target){
  return new Proxy(target, proxyHandler)
}

export { reactive }
```
> `proxyHandler`的解析
>> `proxyHandler`是一个对象包括两个属性，`get` `set`，其值都是一个`Function`
>>> 在`get`函数中 执行`const res = Reflect.get(target, key, receiver) // feel as target[key] as` 获取当前正在获取的对象的值，然后判断当前获取的值`res`是否为对象，如果是对象，递归调用`reactive`函数
知识点来了：**这里体现了`proxy`的一个好处就是，我们不需要在一开始就循环遍历所有传进来的对象的key来进行数据劫持，只需要在获取的时候判断是否是对象，如果是对象直接再执行`reactive`函数返回一个`proxy`, 大大提升效率。**
`get`函数中做的第二件事就是进行依赖收集`track`函数，我们稍候再说。
---
>>> 在`set`函数中 需要判断当前要修改的值是新增操作，还是修改操作，针对不同操作，做不同的事。同时使用`const result = Reflect.set(target, key, value, receiver) // feel as target[key] = value as`设置当前修改的值
这里要做的一个重要的事就是**触发依赖更新**`trigger`函数，我们稍候再说。
---
>>> 至此，vue 3.0 中的 reactive函数的实现就完成了，接下来会结合`effect`函数和上面提到的`track`依赖收集 和 `trigger`依赖更新来一起分析。   
      
> `effect` `track` `trigger`函数解析
>> 我们在说`track`和`trigger`之前，先要知道，vue3.0中的effect是什么~，在vue3.0的API中介绍”**立即执行传入的一个函数，并响应式追踪其依赖，并在其依赖变更时重新运行该函数。**“[传送门](https://composition-api.vuejs.org/zh/api.html#watcheffect)。重点是**立即执行传入的一个函数**！！！   
>> 上一章说道，在`get`函数会执行依赖收集，依赖收集，用大白话解释就是，我要知道 我当前获取的这个属性是否有`effect`在使用，如果有我就要再执行一遍这个`effect`, 好，那么我用中文来解释一下代码执行的逻辑。   
首先，`index.js`中执行这样一段代码
```
import { reactive, effect } from './reactivity'

// 把数据进行proxy代理
const data = { name: 'Gourdbaby', arr: [1,2,3] }
const state = reactive(data)  // return Proxy {name: "Gourdbaby", arr: Array(3)}


effect(function(){
  console.log(state.name)
})

state.name = 'Gourdbaby is progressing'
```
>> `state`是一个`proxy`，然后代码执行`effect`函数，在`effect`中会立即执行传给`effect`的函数，然后我们在这个函数中执行了`state.name`，这时候会触发`proxy`的`get`, 我们在`get`函数中执行了`track`方法进行依赖收集，`track`方法维护一个`WeakMap`对象，这个`WeakMap`对象保存着`{ name: 'Gourdbaby', arr: [1,2,3] }`对象里面所有属性所依赖的`effect`，当在触发`trigger`的时候会用到。   
effect的所有逻辑执行完毕，控制台会打印出`Gourdbaby`   

>> 代码接着走, 执行`state.name = 'Gourdbaby is progressing'`触发了`set`函数，我们在`set`函数中执行了`trigger`方法，来触发依赖更新，也就是执行`name`属性所依赖的`effect`。执行`trigger`的时候，先获取维护的`WeakMap`中是否有当前操作对象，如果有才继续往下操作，这里的操作相对简单，也就是拿到当前操作的`key`也就是`name`，然后获取`name`所依赖的`effect`执行该方法，这时`effect`又会去执行你传去的函数。此时页面打印出`Gourdbaby is progressing`。   
>> 到此，整个vue 3.0 `reactive`，`effect`执行逻辑的代码讲解完毕，稍后会增加`computed方法`
---
> 下面来说一下`computed`方法的实现和执行逻辑，这个方法还是有很多逻辑关系在里，一定要debugger跟才行，要不很难想明白。
>> 先来说一下computed的基本用法和规则，首先computed是一个函数，可以接收一个函数或者一个对象，如果传入一个对象的话，对象上要有两个属性`get` `set`   
computed里传入的函数当它依赖的值发生改变了，他才会执行（也就是，你在该函数中用到的Proxy对象下的属性），并且computed默认不会执行，只有当你取值或者赋值的时候才会执行（这里的实现方式是vue2的 `Object.definePropotype`）   
还有就是，computed是有缓存机制的，当你多次取值的时候不会每次都执行computed函数，只有第一次才执行（这里的实现方式就是靠一个变量判断实现`dirty`）
>> 下面说一下当你修改了computed中依赖的属性后，整个computed的执行逻辑   
```
import { reactive, effect, computed } from './reactivity'

// 把数据进行proxy代理
const data = { name: 'Gourdbaby', arr: [1,2,3] }
const state = reactive(data)  // return Proxy {name: "Gourdbaby", arr: Array(3)}

const myName = computed(() => {
  console.log('ok') 
  return state.name + 'minxiang.sun'
})

effect(function(){
  console.log(myName.value)
})

state.name = 'Gourdbaby is progressing'
```
>>> 代码执行到`computed`的时候，myName 返回了一个响应式对象，上文中有提到，veu2的`definePropotype`，然后代码执行effect，立即执行传进来的函数，代码执行到`console.log(myName.value)`
取值操作，执行到了响应式对象的`get`方法， `get`方法中首先判断`dirty`是否为true，证明是否是第一次执行，也就是缓存机制的实现，如果执行了，就把`dirty`变为`false`，以后再取值就不会再执行该函数了，会直接把上次存起来的value返回出去。只有在你修改值以后才会再重新执行。接着代码执行`runner`函数，`runner`函数式一个`effect`这个`effect`标记了当前是一个computed，`runner`函数执行时就会执行一开始传给`computed`的函数，`computed`函数执行了`return state.name + 'minxiang.sun'`发现依赖属性`state.name`，此时触发了`proxy`的`get`函数，`get`函数进行依赖收集，执行到了`track`函数，把`name`属性依赖的`computed` `effect`收集起来，接着返回`state.name + 'minxiang.sun'`的执行结果。接着把`dirty`设置为`false`，进行缓存，然后再进行`track`依赖收集，这时候的依赖收集是收集的是`console.log(myName.value)`这个函数的effect，为的是当我们修改了`computed`依赖的属性时能够执行到`effect`**（这里有点乱，文字属实不好描述，如需帮助可以联系本人）**   
 当执行`state.name = 'Gourdbaby is progressing'`这句话的时候会触发`proxy`的`set`方法，`set` 中会触发`trigger`，找到name依赖的`computed effect`然后重点：我们在`trigger`中处理`computed effect`的时候如果发现是`computed effect`执行的其实是`computed effect`对象下的`scheduler`在`scheduler`中会把dirty变为`true`因为修改值会重新触发`computed`,然后再触发`trigger`函数 执行普通的`effect`打印出修改后的值。
 ---
 到此，vue3.0的 `reactive effect computed`都解释完成，最核心的就是`effect`方法，这里的逻辑关系非常紧密，一环扣一环，读者需要跟着代码debugger多走几遍，方可探寻其中奥秘，本次文字解说原因有二
 1. 方便自己以后复习，给自己思路引导
 2. 帮助读者快速理解其原理
所谓万丈高楼平地起，我们仍须努力，打好基础，向着未来迸发！！！
