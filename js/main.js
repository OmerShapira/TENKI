
var textures 			= {}
var shaders 			= {}
var framebuffers 		= new Map() 
var framebufferTextures = new Map()
var programs 			= new Map() 

var canvas = document.getElementById("mainCanvas")	
var gl = InitGLContext(canvas)
window.onresize = ResizeCanvas

if (gl) { Start(gl) }

//////////////////////////////////////////

function Start(gl)
{
	LoadAssets(gl, textures)
	LoadShaders(gl, shaders, new Map([
		["vs-ScreenSpace", 	gl.VERTEX_SHADER],
		["fs-FontSampler", 	gl.FRAGMENT_SHADER],
		["fs-Main", 		gl.FRAGMENT_SHADER]
		]))

	programs.set("FontSampler", CreateProgram(gl, 
			[shaders["vs-ScreenSpace"], shaders["fs-FontSampler"]]
		))
	programs.set("Main", CreateProgram(gl, 
			[shaders["vs-ScreenSpace"], shaders["fs-Main"]]
		))

	//Set up Buffers
	var vertexBuffer = new Float32Array([
		//locations
		-1,		1,	
		1,		1,	
		-1,		-1,	
		1,		-1,
		//uvs
		0,		0,
		1,		0,
		0,		1,
		1,		1
		])

	var indexBuffer = new Int16Array([0,1,2, 3,2,1])
	
	//Set up GL	buffers
	var screen_vertex = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, screen_vertex)
	gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW)

	var screen_index = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, screen_index)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW)
	
	//Set up attributes	
	for (let pgm of programs.values())
	{
		var positionLocation = gl.getAttribLocation(pgm, "vPosition")
		gl.enableVertexAttribArray(positionLocation)
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, gl.FALSE, 0, 0)

		var texCoordLocation = gl.getAttribLocation(pgm, "vTexCoord")
		gl.enableVertexAttribArray(texCoordLocation)
		gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, gl.FALSE, 0, 8 * 4)
	}	

	//Reset Size

	ResizeCanvas()

	//Set up uniforms

	WithProgram(programs.get("FontSampler"), () => {
		gl.uniform1i(gl.getUniformLocation(programs.get("FontSampler"), "font"), 0)
	})

	WithProgram(programs.get("Main"), () => {
		gl.uniform1i(gl.getUniformLocation(programs.get("Main"), "mainTex"), 1)
		gl.uniform1i(gl.getUniformLocation(programs.get("Main"), "bg"),      2)
		gl.uniform1f(gl.getUniformLocation(programs.get("Main"), "image_presence"), 0) 
	})
	

	//Bind textures
	
	var tex = CreateTexture(gl, {
		"width": gl.drawingBufferWidth,
		"height": gl.drawingBufferHeight,
		"min" : gl.LINEAR, 
		"mag" : gl.LINEAR, 
		"wrap": gl.CLAMP_TO_EDGE, 
		"generateMipmap": false})
	framebufferTextures.set("Text", tex)
	var fb = gl.createFramebuffer()
	framebuffers.set("Text", fb)
	
	WithFramebuffer (fb, () => {
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
	})

	//set up drawing context

	gl.clearColor(0,0,0,1)
	gl.enable(gl.DEPTH_TEST)
	gl.depthFunc(gl.LEQUAL)
	
	//start

	Loop(0) 
}

function Update(gl, time)
{
	Timer.Tick(time)

	for (let pgm of programs.values())
	{
		WithProgram(pgm, () => {
			gl.uniform1f(gl.getUniformLocation(pgm, "time"), time)
		})
	}
	
}

function Draw(gl, time){


	BindTextureAt(textures["unifont"], gl.TEXTURE_2D, 0)

	WithFramebuffer(framebuffers.get("Text"), () => {
		WithProgram(programs.get("FontSampler"), () => {

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)

		})
	})

	BindTextureAt(framebufferTextures.get("Text"), gl.TEXTURE_2D, 1)
	BindTextureAt(textures["bg"], gl.TEXTURE_2D, 2)

	WithProgram(programs.get("Main"), () => {
		gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
	})
}


/////////////////////////////////////////////


function Loop(time)
{
	window.requestAnimationFrame(Loop)
	Update(gl, time)
	Draw(gl, time)
}

function LoadTextureFromSource(name, source, params)
{
	return new Promise( (resolve, reject) => {
		var img = new Image()
		//TODO (OS): Make optional
		img.crossOrigin = "anonymous"
		img.onload = () => 
		{ 
			params.pixels = img
			//TODO (OS): This blocks too, need to async
			let tex = CreateTexture(gl, params)
			if (tex) 
			{
				textures[name] = tex 
				resolve(tex);
			}
			else 
			{ 
				reject ("Couldn't Create Texture : " + name)
			}
		}
		img.src = source
	})
}

function LoadAssets(gl, textures)
{
	//TODO (OS): Make this cleaner and through the top level
	LoadTextureFromSource("unifont", "assets/unifont-8.0.01.bmp", {"min" : gl.LINEAR, "mag": gl.NEAREST, "wrap": gl.REPEAT, "generateMipmap" : true}) 
}


function CreateTexture(gl, params)
{
	params = params || {}
	var tex = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, tex)
	if (params.width && params.height)
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, params.width, params.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, params["pixels"] || null)
	}
	else
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, params["pixels"] || null)
	}
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, params["mag"] || gl.CLAMP)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, params["min"] ||gl.NEAREST_MIPMAP_NEAREST)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, params["wrap"] || gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, params["wrap"] || gl.CLAMP_TO_EDGE)
	if (params["generateMipmap"]) { gl.generateMipmap(gl.TEXTURE_2D) }
	gl.bindTexture(gl.TEXTURE_2D, null)
	return tex
}

function CreateProgram(gl, shaders)
{
	var pgm = gl.createProgram()

	for (let shader of shaders) { gl.attachShader(pgm, shader) }

	gl.linkProgram(pgm)

	if (!gl.getProgramParameter(pgm, gl.LINK_STATUS))
	{
		var info = gl.getProgramInfoLog(pgm)
		console.error("Could not link program : " + info)
		return null	
	}

	return pgm
}

function LoadShaders(gl, shaders, list)
{
	let create = (src, type) => 
	{
		var shader = gl.createShader(type)
		gl.shaderSource(shader, src)
		gl.compileShader(shader)

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			var info = gl.getShaderInfoLog(shader)
			console.error("Shader Compile Error: " + info)
		}
		else
		{
			return shader
		}
	}

	let source = (id) => document.getElementById(id).innerHTML

	let store = (id, type) => { shaders[id] = create(source(id), type) }

	for (let [key, val] of list)
	{
		store(key, val)
	}
	
}

function BindTextureAt(texture, type, bindOffset)
{
	let active = gl.getParameter(gl.ACTIVE_TEXTURE)
	gl.activeTexture(gl.TEXTURE0 + bindOffset)
	gl.bindTexture(type, texture)
	gl.activeTexture(active)
}

function UpdateViewportSize(gl)
{
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
	for (let pgm of programs.values())
	{
		gl.useProgram(pgm)
		gl.uniform2f(gl.getUniformLocation(pgm, "screenResolution"), gl.drawingBufferWidth, gl.drawingBufferHeight);
	}
}

function WithProgram(pgm, func)
{
	let active = gl.getParameter(gl.CURRENT_PROGRAM)
	gl.useProgram(pgm)
	func()
	gl.useProgram(active)
}

function WithFramebuffer(fb, func)
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
	func()
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function InitGLContext(canvas)
{
	try
	{
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	}
	catch(e) {}
	if (!gl) 
	{
		console.error("WebGL is not enabled on this browser")
		gl = null
	}
  return gl
}

function ResizeCanvas ()
{
	canvas.width 	= window.innerWidth
	canvas.height 	= window.innerHeight
	if (gl){ UpdateViewportSize(gl) }
}