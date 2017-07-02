function TextBlock (text, size, position)
{
  const ANGLE = gl.getExtension('ANGLE_instanced_arrays')

  let _bufferAspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
  let _text = text || ""
  let _position = position || [0.5, 0.5]
  let _sizeMult = size || 0.05
  var _size = [_sizeMult, _sizeMult]
  if (_bufferAspectRatio > 1)
  {
    _size[0] /= _bufferAspectRatio
  }
  else
  {
    _size[1] *= _bufferAspectRatio
  }

  let _instanceData = []

  var _instanceDataBuffer
  var _charCount =  0

  //make display list
  for (let i = 0; i < _text.length; ++i)
  {
    //TODO (OS): find a better way to detect whitespace
    if (_text[i] == _text[i].trim())
    {
      //calculate position
      let offset = _getOffset(i)
      _instanceData.push(_position[0] + offset[0], _position[1] + offset[1])

      //calculate unicode
      let uv = _getTextUV_UL(_text[i])
      _instanceData.push(uv[0], uv[1])

      ++_charCount
    }
  }


  function _getOffset (index)
  {
    return [_position[0] + _size[0] * 2.0 * index, _position[1]]
    //TODO (OS): implement wrap
  }

  function _getTextUV_UL (character)
  {
    let code = character.charCodeAt(0)
    return [(code & 0x00FF) / 256.0, ((code & 0xFF00) >> 8) / 256.0]
  }

  //setup

  WithProgram (programs.get("TextBlock"), (pgm) => {
    _instanceDataBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, _instanceDataBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_instanceData), gl.STATIC_DRAW)
  })

  return {
    Draw: function()
    {
      WithProgram(programs.get("TextBlock"), (pgm)=>{

        let len = Math.round(_charCount)

        gl.bindBuffer(gl.ARRAY_BUFFER, _instanceDataBuffer)

        let sizeLocation = gl.getUniformLocation(pgm, "size")
        gl.uniform2f(sizeLocation, _size[0], _size[1])

        let offsetLocation = gl.getAttribLocation(pgm, "offset")
        gl.enableVertexAttribArray(offsetLocation)
        gl.vertexAttribPointer(offsetLocation, 2, gl.FLOAT, gl.FALSE, 4 * 4, 0)
        ANGLE.vertexAttribDivisorANGLE(offsetLocation, 1)

        let charUVLocation = gl.getAttribLocation(pgm, "charUV")
        gl.enableVertexAttribArray(charUVLocation)
        gl.vertexAttribPointer(charUVLocation, 2, gl.FLOAT, gl.FALSE, 4 * 4, 2 * 4)
        ANGLE.vertexAttribDivisorANGLE(charUVLocation, 1)

        ANGLE.drawElementsInstancedANGLE(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, len)

        // ANGLE.vertexAttribDivisorANGLE(offsetLocation, 0)
        // ANGLE.vertexAttribDivisorANGLE(charUVLocation, 0)

      })
    }
  }
}
