import proxyHandler from './baseHandler'


function reactive(target){
  return new Proxy(target, proxyHandler)
}


export { reactive }