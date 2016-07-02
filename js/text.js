function TextBlock (text, size, position)
{
	let _text = text || ""
	let _size = size || 0.05
	let _position = position || [0.5, 0.5]

	let _instanceData_pos = [] //new Float32Array()
	let _instanceData_uv = [] //new Float32Array()

	var ANGLE;

	//make display list
	for (let i = 0; i < _text.length; ++i)
	{
		//TODO (OS): find a better way to detect whitespace
		if (_text[i] == _text[i].trim())
		{
			//calculate position
			let offset = _getOffset(i)
			_instanceData_pos.push(_position[0] + offset[0], position[1] + offset[1])

			//calculate unicode
			let uv = _getTextUV_UL(_text[i])
			_instanceData_uv.push(uv[0], uv[1])
		}
	}

	
	function _getOffset (index)
	{
		return [_position[0], _position[1] + _size * index]
		//TODO (OS): implement wrap
	}

	function _getTextUV_UL (character)
	{
		let code = character.charCodeAt(0)
		return [(code & 0x00FF) / 256.0, ((code & 0xFF00) >> 8) / 256.0]
	}

	//setup
	WithProgram (programs.get("TextBlock"), (pgm) => {
		ANGLE = gl.getExtension('ANGLE_instanced_arrays')
		let _offsetBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, _offsetBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, _instanceData_pos, gl.STATIC_DRAW)
		
		let offsetLocation = gl.getAttribLocation(pgm, "offset")
		gl.enableVertexAttribArray(offsetLocation)
		gl.vertexAttribPointer(offsetLocation, 2, gl.FLOAT, gl.FALSE, 0, 0)
		ANGLE.vertexAttribDivisorANGLE(offsetLocation, 6) 

		let _charUVBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, _charUVBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, _instanceData_uv, gl.STATIC_DRAW)	

		let charUVLocation = gl.getAttribLocation(pgm, "charUV")
		gl.enableVertexAttribArray(charUVLocation)
		gl.vertexAttribPointer(charUVLocation, 2, gl.FLOAT, gl.FALSE, 0, 0)
		ANGLE.vertexAttribDivisorANGLE(charUVLocation, 0)
	})

	return {
		Draw: function()
		{
			WithProgram(programs.get("TextBlock"), (pgm)=>{
				let sizeLocation = gl.getUniformLocation(pgm, "size")
				gl.uniform1f(sizeLocation, _size)

				let len = Math.round(_instanceData_uv.length / 2)
				ANGLE.drawElementsInstancedANGLE(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, len)
			})
		}
	}
}