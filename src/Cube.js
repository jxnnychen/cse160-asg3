class Cube{
    constructor() {
      this.type='cube';
    //   this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
    //   this.size = 5.0
    //   this.segments = 10;
    this.matrix = new Matrix4();
    this.textureNum = -2;
    }
  
    render() {
        var rgba = this.color;
  
        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // front
        drawTriangle3DUV([0,0,0,  1,1,0,  1,0,0], [0,0,  1,1,  1,0]);
        drawTriangle3DUV([0,0,0,  0,1,0,  1,1,0], [0,0,  0,1,  1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        // top
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0,  0,1,  1,1]);
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0,  1,1,  1,0]);   

        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        // bottom
        drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,1,  1,1,  1,0]);
        drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,1,  1,0,  0,0]);

        gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
        // left
        drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [1,0,  0,0,  0,1]);
        drawTriangle3DUV([0,0.0,0, 0,1,1, 0,1,0], [1,0,  0,1,  1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
        // right
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0,  0,1,  1,1]);
        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0,  1,1,  1,0]);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // back
        drawTriangle3DUV([0,0,1, 0,1,1, 1,1,1], [1,0,  1,1,  0,1]);
        drawTriangle3DUV([0,0,1, 1,1,1, 1,0,1], [1,0,  0,1,  0,0]);

      
    }

    renderfast() {
      var rgba = this.color;

      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      var allVerts = [];
      var allUVs = [];
      // front
      allVerts = allVerts.concat([0,0,0, 1,1,0, 1,0,0]);
      allUVs = allUVs.concat([0,0, 1,1, 1,0]);
      allVerts = allVerts.concat([0,0,0, 0,1,0, 1,1,0]);
      allUVs = allUVs.concat([0,0, 0,1, 1,1]);
      // gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
      
      // top
      allVerts = allVerts.concat([0,1,0, 0,1,1, 1,1,1]);
      allUVs = allUVs.concat([0,0, 0,1, 1,1]);
      allVerts = allVerts.concat([0,1,0, 1,1,1, 1,1,0]);   
      allUVs = allUVs.concat([0,0, 1,1, 1,0]);
      // gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
     
      // bottom
      allVerts = allVerts.concat([0,0,0, 1,0,0, 1,0,1]);
      allUVs = allUVs.concat([0,1, 1,1, 1,0]);
      
      allVerts = allVerts.concat([0,0,0, 1,0,1, 0,0,1]);
      allUVs = allUVs.concat([0,1, 1,0, 0,0]);
      // gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
      
      // left
      allVerts = allVerts.concat([0,0,0, 0,0,1, 0,1,1]);
      allUVs = allUVs.concat([1,0, 0,0, 0,1]);
  
      allVerts = allVerts.concat([0,0,0, 0,1,1, 0,1,0]);
      allUVs = allUVs.concat([1,0, 0,1, 1,1]);

      // gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
      // right
      allVerts = allVerts.concat([1,0,0, 1,1,0, 1,1,1]);
      allUVs = allUVs.concat([0,0, 0,1, 1,1]);
  
      allVerts = allVerts.concat([1,0,0, 1,1,1, 1,0,1]);
      allUVs = allUVs.concat([0,0, 1,1, 1,0]);

      // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      // back
      allVerts = allVerts.concat([0,0,1, 0,1,1, 1,1,1]);
      allUVs = allUVs.concat([1,0, 1,1, 0,1]);
      
      allVerts = allVerts.concat([0,0,1, 1,1,1, 1,0,1]);
      allUVs = allUVs.concat([1,0, 0,1, 0,0]);
      
      drawTriangle3DUVBatch(allVerts, allUVs);

    
  }
  }
  