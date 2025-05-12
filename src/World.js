// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0; // sky
  uniform sampler2D u_Sampler1; // snow
  uniform sampler2D u_Sampler2; // ice
  uniform sampler2D u_Sampler3; // dirt
  uniform sampler2D u_Sampler4; // packed ice

  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;    // use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0); // use uv debug color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture ==  1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else {
      gl_FragColor = vec4(1,.2,.2,1);
    }
  }`

// add global vars
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;
let g_camera;

let g_globalAngle = 0;

let g_yellowAngle = 0;
let g_magentaAngle = 0;

let g_yellowAnimation = false;
let g_magentaAnimation = false;

// mouse tracking 
let g_isDragging = false;
let g_lastX = -1;
let g_lastY = -1;
let g_xRotation = 0;
let g_yRotation = 0;

let g_worldMap = Array.from({length:32}, () => Array.from({length:32}, () => Array(32).fill(0)));
let g_selectedBlockType = 1;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
  }
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');

  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
}

function setupControls() {

  // document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});
  // document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderAllShapes();})
  // document.getElementById('magentaSlide').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderAllShapes();})


  // document.getElementById('animationYellowOffButton').onclick = function() {g_yellowAnimation = false;};
  // document.getElementById('animationYellowOnButton').onclick = function() {g_yellowAnimation = true;};
  // document.getElementById('animationMagentaOffButton').onclick = function() {g_magentaAnimation = false;};
  // document.getElementById('animationMagentaOnButton').onclick = function() {g_magentaAnimation = true;};

  document.getElementById('blockTypeSnow').onclick = function() {g_selectedBlockType = 1; updateBlockTypeDisplay();};
  document.getElementById('blockTypeIce').onclick = function() {g_selectedBlockType = 2; updateBlockTypeDisplay();};
  document.getElementById('blockTypeDirt').onclick = function() {g_selectedBlockType = 3; updateBlockTypeDisplay();};
  document.getElementById('blockTypePackedIce').onclick = function() {g_selectedBlockType = 4; updateBlockTypeDisplay();};

}

function updateBlockTypeDisplay() {
  const blockTypes = {
    1: "Snow",
    2: "Ice",
    3: "Dirt",
    4: "Packed Ice"
  };
  document.getElementById('currentBlockType').textContent = blockTypes[g_selectedBlockType] || "Snow";
}

function main() {

  setupWebGL();
  connectVariablesToGLSL();
  setupControls();

  initWorldMap();
  g_camera = new Camera();
  g_camera.eye.elements[0] =  0;  // X
  g_camera.eye.elements[1] =  1;  // Y = one block above floor (floor is at y=0)
  g_camera.eye.elements[2] =  0;  // Z
  g_camera.at.elements [0] =  0;
  g_camera.at.elements [1] =  1;
  g_camera.at.elements [2] = -1;

  document.onkeydown = keydown;

  canvas.onmousedown = ev => {
    g_isDragging = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  };
  canvas.onmouseup = canvas.onmouseleave = () => {
    g_isDragging = false;
  };
  canvas.onmousemove = ev => {
    if (!g_isDragging) return;
    const dx = ev.clientX - g_lastX;
    g_lastX = ev.clientX;
    // only pan on horizontal drag
    if      (dx >  1) g_camera.panRight();
    else if (dx < -1) g_camera.panLeft();
    renderAllShapes();
  };

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  updateBlockTypeDisplay();

  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds=performance.now()/1000.0-g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}
 
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = (45*Math.sin(g_seconds));
  }
  if (g_magentaAnimation) {
    g_magentaAngle = (45*Math.sin(3*g_seconds));
  }
}

function keydown(ev) {
  const e = g_camera.eye.elements;
  const a = g_camera.at.elements;
  const dirX = a[0]-e[0], dirZ = a[2]-e[2];
  const len = Math.hypot(dirX, dirZ) || 1;
  switch (ev.key) {
    case 'w':
      g_camera.forward();
      break;
    case 's':
      g_camera.back();
      break;
    case 'a':
      g_camera.left();
      break;
    case 'd':
      g_camera.right();
      break;
    case 'q':
      g_camera.panLeft();
      break;
    case 'e':
      g_camera.panRight();
      break;
      case 'f': // Add block
      addBlock();
      break;
    case 'r': // Remove block
      removeBlock();
      break;
    case '1': // Select snow block
      g_selectedBlockType = 1;
      updateBlockTypeDisplay();
      break;
    case '2': // Select ice block
      g_selectedBlockType = 2;
      updateBlockTypeDisplay();
      break;
    case '3': // Select dirt block
      g_selectedBlockType = 3;
      updateBlockTypeDisplay();
      break;
    case '4': // Select packed ice block
      g_selectedBlockType = 4;
      updateBlockTypeDisplay();
      break;
  }
  renderAllShapes();
  console.log(ev.keyCode);
}

function initWorldMap() {
  // Initialize the 3D world map array
  for(let y = 0; y < 32; y++) {
    for(let z = 0; z < 32; z++) {
      for(let x = 0; x < 32; x++) {
        g_worldMap[y][z][x] = 0; // 0 = air (empty)
      }
    }
  }

  // Create the floor (y=0)
  for(let z = 0; z < 32; z++) {
    for(let x = 0; x < 32; x++) {
      g_worldMap[0][z][x] = 1; // 1 = snow
    }
  }

  // simple mountain
  for(let z = 8; z <= 12; z++) {
    for (let x = 8; x <= 12; x++) {
      g_worldMap[1][z][x] = 3; // dirt
      g_worldMap[2][z][x] = 3; // dirt
      g_worldMap[3][z][x] = 1; // snow
    }
  }
  for(let z = 12; z <= 15; z++) {
    for (let x = 6; x <= 9; x++) {
      g_worldMap[1][z][x] = 3; // dirt
      g_worldMap[2][z][x] = 1; // dirt
    }
  }

  // second mountain
  for(let z = 25; z <= 27; z++) {
    for (let x = 17; x <= 21; x++) {
      g_worldMap[1][z][x] = 3; // dirt
      g_worldMap[2][z][x] = 1; // dirt
    }
  }

  for (let i = 0; i < 32; i++) {  // walls
    // Dirt layers (y=1, y=2)
    for (let y = 1; y <= 2; y++) {
      g_worldMap[y][0][i] = 3;  // Front wall
      g_worldMap[y][31][i] = 3; // Back wall
      g_worldMap[y][i][0] = 3;  // Left wall
      g_worldMap[y][i][31] = 3; // Right wall
    }
    // Snow cap (y=3)
    g_worldMap[3][0][i] = 1;
    g_worldMap[3][31][i] = 1;
    g_worldMap[3][i][0] = 1;
    g_worldMap[3][i][31] = 1;
  }
  for(let z = 15; z <= 20; z++) {
    for (let x = 24; x <= 28; x++) {
      g_worldMap[1][z][x] = 1; // dirt
    }
  }
  
  
  // Ice pool
  for (let z = 20; z < 23; z++) {
    for (let x = 20; x < 23; x++) {
      g_worldMap[0][z][x] = 2; // ice blocks at ground level
    }
  }

  // large ice spikes ( random ) 3x3x4, cross shape x3, center x3
  const largeCoords = [[5,5],[5,26],[26,5],[26,26],[5,10],[14,20], [10,28], [23,21], [28,13],[10,13]];
  for (let s = 0; s < largeCoords.length; s++) {
    const [cx, cz] = largeCoords[s];
    // Base 3x3, height 1..4
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let h = 1; h <= 4; h++) {
          const x = cx + dx;
          const z = cz + dz;
          if (x >= 0 && x < 32 && z >= 0 && z < 32) {
            g_worldMap[h][z][x] = 2; // ice
          }
        }
      }
    }
    // Cross shape (center + N/E/S/W), height 5..7
    const crossOffsets = [[0,0], [1,0], [-1,0], [0,1], [0,-1]];
    for (const [dx, dz] of crossOffsets) {
      for (let h = 5; h <= 7; h++) {
        const x = cx + dx;
        const z = cz + dz;
        if (x >= 0 && x < 32 && z >= 0 && z < 32) {
          g_worldMap[h][z][x] = 2;
        }
      }
    }
    // Center column, height 8..10
    for (let h = 8; h <= 10; h++) {
      if (cx >= 0 && cx < 32 && cz >= 0 && cz < 32) {
        g_worldMap[h][cz][cx] = 2;
      }
    }
  }

  // medium ice spikes cross x 3, center x 4
  const medCoords = [[8,18],[12,4],[22,11],[28,18],[16,28]];
  for (let m = 0; m < medCoords.length; m++) {
    const [cx, cz] = medCoords[m];
    const crossOffsets = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    // Cross height 1..3
    for (const [dx, dz] of crossOffsets) {
      for (let h = 1; h <= 4; h++) {
        const x = cx + dx;
        const z = cz + dz;
        if (x >= 0 && x < 32 && z >= 0 && z < 32) {
          g_worldMap[h][z][x] = 2;
        }
      }
    }
    // Center column height 4..7
    for (let h = 5; h <= 6; h++) {
      if (cx >= 0 && cx < 32 && cz >= 0 && cz < 32) {
        g_worldMap[h][cz][cx] = 2;
      }
    }
  }

  // // small ice spikes
  const smallCoords = [[22,14],[22,25],[14,27],[8,23],[2,14]];
  for (let t = 0; t < smallCoords.length; t++) {
    const [cx, cz] = smallCoords[t];
    // Base 2x2 height 1..3
    for (let dx = 0; dx <= 1; dx++) {
      for (let dz = 0; dz <= 1; dz++) {
        for (let h = 1; h <= 3; h++) {
          const x = cx + dx;
          const z = cz + dz;
          if (x >= 0 && x < 32 && z >= 0 && z < 32) {
            g_worldMap[h][z][x] = 2;
          }
        }
      }
    }
    // Top block at one corner (cx,cz) height 4..5
    for (let h = 4; h <= 5; h++) {
      if (cx >= 0 && cx < 32 && cz >= 0 && cz < 32) {
        g_worldMap[h][cz][cx] = 2;
      }
    }
  }


  // igloo
  const icx = 18, icz = 5;
  // Walls: two layers, ring radius ≈3
  for (let y = 1; y <= 2; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const dist2 = dx*dx + dz*dz;
        if (dist2 >= 7 && dist2 <= 12) {
          const x = icx + dx, z = icz + dz;
          if (x>=0&&x<32&&z>=0&&z<32) g_worldMap[y][z][x] = 4;
        }
      }
    }
  }
  // entrance
  g_worldMap[1][8][18] = 0;
  g_worldMap[2][8][18] = 0;
  g_worldMap[1][9][17] = 4;
  g_worldMap[2][9][17] = 4;
  g_worldMap[1][9][19] = 4;
  g_worldMap[2][9][19] = 4;
  g_worldMap[3][9][18] = 4;

  // roof
  for (let layer = 0; layer < 3; layer++) {
    const y = 3 + layer;
    const r = 3 - layer;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx*dx + dz*dz <= r*r) {
          const x = icx + dx, z = icz + dz;
          if (x>=0&&x<32&&z>=0&&z<32) g_worldMap[y][z][x] = 4;
        }
      }
    }
  }


}

  

function getTargetCell(){
  const e=g_camera.eye.elements, a=g_camera.at.elements;
  let vx=a[0]-e[0], vz=a[2]-e[2];
  const len=Math.hypot(vx,vz)||1; vx/=len; vz/=len;
  const x=Math.floor(e[0]+vx*1.2+0.5), z=Math.floor(e[2]+vz*1.2+0.5);
  return {x,z};
}
function modifyBlock(delta){
  const {x,z}=getTargetCell();
  if(x<0||x>=32||z<0||z>=32) return;
  const stack=mapStacks[z][x];
  if(delta<0){ stack.pop(); }
  else { stack.push(3); /* add dirt */ }
}

function getBlockInFront() {
  // Get camera direction vector (normalized)
  const dirX = g_camera.at.elements[0] - g_camera.eye.elements[0];
  const dirZ = g_camera.at.elements[2] - g_camera.eye.elements[2];
  
  // Normalize the direction vector
  const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
  const normDirX = dirX / length;
  const normDirZ = dirZ / length;
  
  // Get camera position
  const eyeX = g_camera.eye.elements[0];
  const eyeY = g_camera.eye.elements[1];
  const eyeZ = g_camera.eye.elements[2];
  
  // Calculate target position (3 units in front of camera)
  const targetX = eyeX + normDirX * 3;
  const targetZ = eyeZ + normDirZ * 3;
  
  // Convert to map coordinates (adding half map size since map is centered at origin)
  const mapX = Math.floor(targetX + 16);
  const mapZ = Math.floor(targetZ + 16);
  
  // Find height of block column at this position
  let mapY = 0;
  for(let y = 0; y < 32; y++) {
    if(mapZ >= 0 && mapZ < 32 && mapX >= 0 && mapX < 32 && g_worldMap[y][mapZ][mapX] > 0) {
      mapY = y;
    }
  }
  
  return { x: mapX, y: mapY, z: mapZ };
}
function addBlock() {
  const target = getBlockInFront();
  
  // Check if the target is valid
  if(target.x >= 0 && target.x < 32 && target.z >= 0 && target.z < 32) {
    // Add a block on top of the existing column
    const y = target.y + 1;
    
    // Make sure we don't go above map height and the space is empty
    if(y < 32 && g_worldMap[y][target.z][target.x] === 0) {
      g_worldMap[y][target.z][target.x] = g_selectedBlockType;
      console.log(`Added ${g_selectedBlockType} block at (${target.x}, ${y}, ${target.z})`);
      return true;
    }
  }
  return false;
}

function removeBlock() {
  const target = getBlockInFront();
  
  // Check if the target is valid
  if(target.x >= 0 && target.x < 32 && target.z >= 0 && target.z < 32) {
    // Make sure we're not removing the floor (y=0)
    if(target.y > 0) {
      g_worldMap[target.y][target.z][target.x] = 0;
      console.log(`Removed block at (${target.x}, ${target.y}, ${target.z})`);
      return true;
    }
  }
  return false;
}



function initTextures() {
  const textures = [
    ['sky.jpg', sendImageToTEXTURE0],
    ['snow.jpg', sendImageToTEXTURE1],
    ['ice.jpg',  sendImageToTEXTURE2],
    ['dirt.jpg',  sendImageToTEXTURE3],
    ['packedice.jpg', sendImageToTEXTURE4]
  ];
  textures.forEach(([url, fn]) => {
    const img = new Image();
    img.onload = () => {
      fn(img);
      console.log(`Loaded texture ${url}`);
      renderAllShapes();  // redraw as soon as available
    };
    img.onerror = () => console.error(`Failed to load ${url}`);
    img.src = url;
  });
  return true;
}


function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);
  
  // gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  console.log('finished loadTexture');
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler1, 1);
  console.log('finished loadTexture');
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler2, 2);
  console.log('finished loadTexture');
}

function sendImageToTEXTURE3(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler3, 3);
  console.log('finished loadTexture');
}

function sendImageToTEXTURE4(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler4, 4);
  console.log('finished loadTexture');
}

function renderAllShapes() {
  var startTime = performance.now()

  var projMat = new Matrix4();
  projMat.setPerspective(50, 1*canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
    g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
    
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // var body = new Cube();
  // body.color = [1.0, 0.0, 0.0, 1.0];
  // body.textureNum = 0;
  // body.matrix.translate(-.25,-0.75, 0.0);
  // body.matrix.rotate(-5,1,0,0);
  // body.matrix.scale(0.5, .3, 0.5);
  // body.renderfast();

  // var leftArm = new Cube();
  // leftArm.color = [1, 1, 0, 1];
  // leftArm.textureNum = -1;
  // leftArm.matrix.setTranslate(0,-.5, 0.0);
  // leftArm.matrix.rotate(-5, 1, 0, 0);
  // leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  // var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
  // leftArm.matrix.scale(0.25, .7, 0.5);
  // leftArm.matrix.translate(-0.5, 0, 0);
  // leftArm.renderfast();
  
  // var box = new Cube();
  // box.color = [1.0, 0, 1, 1.0];
  // box.textureNum = 0;
  // box.matrix = yellowCoordinatesMat;
  // box.matrix.translate(0, 0.65, 0);
  // box.matrix.rotate(g_magentaAngle, 0, 0, 1);
  // box.matrix.scale(0.3, .3, 0.3);
  // box.matrix.translate(-.5,0,-0.001);
  // box.renderfast();

  var sky = new Cube();
  sky.color = [1.0,0.0,0.0,1.0];
  sky.textureNum = 0;
  sky.matrix.scale(50,50,50);
  sky.matrix.translate(-0.5,-0.5,-0.5);
  sky.renderfast();

  const half = 16; // Half the map size for centering
  for(let y = 0; y < 32; y++) {
    for(let z = 0; z < 32; z++) {
      for(let x = 0; x < 32; x++) {
        const blockType = g_worldMap[y][z][x];
        if(blockType > 0) { // If there's a block here
          let cube = new Cube();
          // Set texture based on block type
          // 1=snow, 2=ice, 3=dirt, 4=packed ice
          cube.textureNum = blockType;
          cube.matrix.setTranslate(x-half, y-1, z-half);
          cube.renderfast();
        }
      }
    }
  }


  const targetBlock = getBlockInFront();
  if(targetBlock.x >= 0 && targetBlock.x < 32 && targetBlock.z >= 0 && targetBlock.z < 32) {
    // Draw wireframe or highlight to show target position
    const indicator = new Cube();
    indicator.color = [1.0, 1.0, 0.0, 0.5]; // Yellow semi-transparent
    indicator.textureNum = -2; // Use solid color
    indicator.matrix.setTranslate(targetBlock.x-half, targetBlock.y+0.05, targetBlock.z-half);
    indicator.matrix.scale(1.05, 0.05, 1.05); // Thin highlight on top of the block
    indicator.renderfast();
  }


  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot")
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
