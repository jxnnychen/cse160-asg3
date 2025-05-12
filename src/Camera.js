class Camera {
    constructor() {
        this.fov = 60;

        this.eye = new Vector3([0, 0, 0]);
        this.at  = new Vector3([0, 0,-1]);
        this.up  = new Vector3([0, 1, 0]);
        
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.updateMatrices();
    }

    updateMatrices() {
        const e = this.eye.elements,
              a = this.at.elements,
              u = this.up.elements;
    
        this.viewMatrix.setLookAt(
          e[0], e[1], e[2],
          a[0], a[1], a[2],
          u[0], u[1], u[2]
        );
    
        this.projectionMatrix.setPerspective(
          this.fov,
          canvas.width / canvas.height,
          0.1,
          1000
        );
      }

      _canMoveTo(pos) {
        // pos is a Vector3
        const x = pos.elements[0], z = pos.elements[2];
        const ix = Math.floor(x + 16.5);
        const iz = Math.floor(z + 16.5);
        // out of bounds?
        if (ix < 0 || ix >= 32 || iz < 0 || iz >= 32) return false;
        // must have empty at floor (y=1) and head (y=2)
        return g_worldMap[1][iz][ix] === 0 && g_worldMap[2][iz][ix] === 0;
      }

forward(step = 1) {
    const dir  = this._normalize(this._sub(this.at, this.eye));
    const move = this._scale(dir, step);
    const newEye = this._add(this.eye, move);
    const newAt  = this._add(this.at,  move);
    if (this._canMoveTo(newEye)) {
      this.eye = newEye;
      this.at  = newAt;
      this.updateMatrices();
    }
  }

  back(step = 1) {
    const dir  = this._normalize(this._sub(this.at, this.eye));
    const move = this._scale(dir, -step);
    const newEye = this._add(this.eye, move);
    const newAt  = this._add(this.at,  move);
    if (this._canMoveTo(newEye)) {
      this.eye = newEye;
      this.at  = newAt;
      this.updateMatrices();
    }
  }

  left(step = 1) {
    const fwd  = this._normalize(this._sub(this.at, this.eye));
    const left = this._normalize(this._cross(this.up, fwd)); // up × fwd
    const move = this._scale(left, step);
    const newEye = this._add(this.eye, move);
    const newAt  = this._add(this.at,  move);
    if (this._canMoveTo(newEye)) {
      this.eye = newEye;
      this.at  = newAt;
      this.updateMatrices();
    }
  }

  right(step = 1) {
    const fwd   = this._normalize(this._sub(this.at, this.eye));
    const right = this._normalize(this._cross(fwd, this.up)); // fwd × up
    const move  = this._scale(right, step);
    const newEye = this._add(this.eye, move);
    const newAt  = this._add(this.at,  move);
    if (this._canMoveTo(newEye)) {
      this.eye = newEye;
      this.at  = newAt;
      this.updateMatrices();
    }
  }
panLeft() {
    this._pan(+5);
}

panRight() {
    this._pan(-5);
}

_pan(angleDeg) {
    const dir     = this._sub(this.at, this.eye);              // eye → at
    const u       = this.up.elements;
    const rot     = new Matrix4().setRotate(angleDeg, u[0], u[1], u[2]);
    const dirNew  = rot.multiplyVector3(dir);                  // Vector3

    this.at = this._add(this.eye, dirNew);
    this.updateMatrices();
  }

  _add(a, b) {
    const ae = a.elements, be = b.elements;
    return new Vector3([ae[0] + be[0], ae[1] + be[1], ae[2] + be[2]]);
  }

  _sub(a, b) {
    const ae = a.elements, be = b.elements;
    return new Vector3([ae[0] - be[0], ae[1] - be[1], ae[2] - be[2]]);
  }

  _scale(v, s) {
    const e = v.elements;
    return new Vector3([e[0] * s, e[1] * s, e[2] * s]);
  }

  _cross(a, b) {
    const ae = a.elements, be = b.elements;
    return new Vector3([
      ae[1]*be[2] - ae[2]*be[1],
      ae[2]*be[0] - ae[0]*be[2],
      ae[0]*be[1] - ae[1]*be[0]
    ]);
  }

  _normalize(v) {                // returns a *new* normalized vector
    const e = v.elements;
    const len = Math.hypot(e[0], e[1], e[2]) || 1;
    return new Vector3([e[0]/len, e[1]/len, e[2]/len]);
  }

}