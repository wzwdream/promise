class MyPromise {
  constructor(executor) {
    // 捕获执行器的代码错误
    try {
      // executor执行器，进入会立即执行
      executor(this.resolve, this.reject)
    } catch (err) {
      this.reject(err);
    }
  }
  // 状态值pending(等待态)，fulfiled(成功态)，rejected(失败态)，默认为pending
  PromiseState = 'pending'

  // 成功的回调
  onFulfilledCallbacks = []

  // 失败的回调
  onRejectedCallbacks = []

  // 执行后的值
  PromiseResult = null

  // 成功的方法
  resolve = (value) => {
    // 如果状态不是pending，则直接返回，因为状态已经改变就不可再次改变
    if (this.PromiseState !== 'pending') return
    // 状态置为成功的状态fulfiled
    this.PromiseState = 'fulfiled'
    // 执行后的值改为传进来的值
    this.PromiseResult = value
    // 查看是否存在可执行的回调
    while (this.onFulfilledCallbacks.length) {
      this.onFulfilledCallbacks.shift()()
    }
    console.log('成功的回调', value)
  }
  // 失败的方法
  reject = (value) => {
    // 如果状态不是pending，则直接返回，因为状态已经改变就不可再次改变
    if (this.PromiseState !== 'pending') return
    // 状态置为失败的状态rejected
    this.PromiseState = 'rejected'
    // 执行后的值改为传进来的值
    this.PromiseResult = value
    // 查看是否存在可执行的回调
    while (this.onRejectedCallbacks.length) {
      this.onRejectedCallbacks.shift()()
    }
    console.log('失败的回调', value)
  }
  then(onFulfilled, onRejected) {
    // 如果不传，就使用默认函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    const promise2 = new MyPromise((resolve, reject) => {
      // 成功
      const resolveMicrotask = () => {
        queueMicrotask(() => {
          // then执行阶段错误捕获
          try {
            const x = onFulfilled(this.PromiseResult);
            this.resolvePromise(x, promise2, resolve, reject);
          } catch (err) {
            reject(err);
          }
        })
      }
      // 失败
      const rejectMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.PromiseResult);
            this.resolvePromise(x, promise2, resolve, reject);
          } catch (err) {
            reject(err);
          }
        })
      }
      // 如果`PromiseState`为`fulfiled`时执行第一个回调（成功的回调）
      if (this.PromiseState === 'fulfiled') {
        resolveMicrotask()
        // 如果`PromiseState`为`rejected`时执行第二个回调（失败的回调）
      } else if (this.PromiseState === 'rejected') {
        rejectMicrotask()
        // 如果`PromiseState`为`pending`时，暂时保存两个回调
      } else if (this.PromiseState === 'pending') {
        this.onFulfilledCallbacks.push(resolveMicrotask)
        this.onRejectedCallbacks.push(rejectMicrotask)
      }
    })
    return promise2;
  }
  resolvePromise(x, promise, resolve, reject) {
    if (x === promise) {
      return reject(new TypeError('The promise and the return value are the same'));
    }
    // 同我们原来的判断 (x instanceof MyPromise) ，这里只是为了和PromiseA+规范保持统一
    if (typeof x === 'object' || typeof x === 'function') {
      if (x === null) {
        return resolve(x);
      }
      let then;
      try {
        then = x.then;
      } catch (err) {
        return reject(err);
      }

      if (typeof then === 'function') {
        let called = false;
        try {
          then.call(x, y => {
            if (called) return;
            called = true;
            this.resolvePromise(y, promise, resolve, reject);
          }, r => {
            if (called) return;
            called = true;
            reject(r);
          })
        } catch (err) {
          if (called) return;
          reject(err);
        }
      } else {
        resolve(x);
      }
    }
    else {
      resolve(x);
    }
  }
  // 静态resolve方法
  static resolve = (value) => {
    if (value instanceof MyPromise) {
      return value;
    }
    // 常规resolve处理
    return new MyPromise((resolve, reject) => {
      resolve(value);
    })
  }
  // 静态reject方法
  static reject = (reason) => {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    })
  }
}



MyPromise.deferred = function () {
  var result = {};
  result.promise = new MyPromise(function (resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}
module.exports = MyPromise;