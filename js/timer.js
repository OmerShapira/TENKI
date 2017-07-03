Timer = (()=>{

  let _subscribers = new Set()
  let _time = 0

  let time = () =>
  {
    if (_time <= 0) time = performance.now()
    return _time
  }

  function _count(duration, update)
  {
    return new Promise( (resolve, reject) =>
    {
      // let _t = time()
      //HACK (OS): Dunno why this doesn't work
      let _t = _time
      let _begin = _time
      let end = _t + duration
      let handle = _tick

      function _tick(t)
      {
        //relative, absolute, delta, remain,
        if (update)
        {
          update(t - _begin, t - _t, end - t)
        }

        _t = t

        if (t >= end)
        {
          _subscribers.delete(handle)
          resolve(t)
        }
      }
      _subscribers.add(handle)
    })
  }

  return {
    Tick : (t) =>
    {
      _time = t
      for (let sub of _subscribers)
      {
        sub(_time)
      }
    },
    Count : _count
  }

})()
