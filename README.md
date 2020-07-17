# vue3.0
Learn vue 3.0
### Usage
  1. npm i
  2. npm run serve
  3. http://localhost:8080
### Realization vue3.0 reactive
index.js文件中引入 `reactive` 其接受一个要对象，返回一个Proxy对象。
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
