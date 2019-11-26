import {
  Mesh,
  Object3D,
  Vector3,
  Vector2,
  MeshStandardMaterial,
  Quaternion,
  BufferGeometry,
  BufferAttribute,
  CanvasTexture,
  Math as _Math,
  UVMapping,
  ClampToEdgeWrapping,
  RGBFormat,
  LinearFilter,
  LinearMipMapLinearFilter,
  DoubleSide,
  BackSide,
  AlphaFormat,
  DepthFormat,
  LuminanceFormat,
  RepeatWrapping
} from "three";
import TWEEN from '@tweenjs/tween.js';
import Manager from "../resources";
import {deltaTimeTween} from "../animUtils";

const TUBE_SEGMENTS = 24;
const TUBE_TURN_SEGMENTS = 16;
const UP_VECTOR = new Vector3(0, 1, 0);

const getCirclePoint = (segmentIndex, radius, position, direction) => {
  let point = new Vector2(0, radius);
  point.rotateAround(new Vector2(0, 0), (Math.PI * 2.0 / TUBE_SEGMENTS) * segmentIndex);
  
  let quaternion = new Quaternion();
  quaternion.setFromUnitVectors(UP_VECTOR, direction.clone().normalize());
  
  let result = new Vector3(point.x, 0, point.y);
  result.applyQuaternion(quaternion);
  
  return position.clone().add(result);
};

const getTubeGeometry = (from, to, radius, pathLength, currentLength) => {
  let vertices = [];
  let normals = [];
  let uvs = [];
  
  let direction = to.clone().sub(from);
  
  let v0 = currentLength / pathLength;
  let v1 = (currentLength + direction.length()) / pathLength;
  
  for (let i = 0; i < TUBE_SEGMENTS; i++) {
    /** First triangle */
    vertices.push(getCirclePoint(i, radius, from, direction));
    vertices.push(getCirclePoint(i, radius, to, direction));
    vertices.push(getCirclePoint(i + 1, radius, from, direction));
  
    let axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
    let axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
    let normal = axis1.cross(axis2);
    
    normals.push(normal.clone().negate());
    normals.push(normal.clone().negate());
    normals.push(normal.clone().negate());
    
    uvs.push(i / TUBE_SEGMENTS, v0,  i / TUBE_SEGMENTS, v1,  (i + 1) / TUBE_SEGMENTS, v0);
    
    /** Second triangle */
    vertices.push(getCirclePoint(i, radius, to, direction));
    vertices.push(getCirclePoint(i + 1, radius, to, direction));
    vertices.push(getCirclePoint(i + 1, radius, from, direction));
  
    axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
    axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
    normal = axis1.cross(axis2);
  
    normals.push(normal.clone().negate());
    normals.push(normal.clone().negate());
    normals.push(normal.clone().negate());
    
    uvs.push(i / TUBE_SEGMENTS, v1,  (i + 1) / TUBE_SEGMENTS, v1,  (i + 1) / TUBE_SEGMENTS, v0);
  }
  
  return {
    vertices,
    normals,
    uvs
  }
};

const getCurvePoint = (p1, p2, p3, radius, dt) => {
  let d1 = p2.clone().sub(p1);
  let d2 = p3.clone().sub(p2);
  
  let cross = d1.clone().normalize().cross(d2.clone().normalize());
  
  let origin = p1.clone().add(d2.clone().normalize().multiplyScalar(radius));
  
  let axis1 = p1.clone().sub(origin);
  let axis2 = p3.clone().sub(origin);
  
  let angleTo = axis1.clone().normalize().angleTo(axis2.clone().normalize());
  
  return axis1.clone().applyAxisAngle(cross, angleTo * dt).sub(axis1);
};

const getTubeTurnGeometry = (p1, p2, p3, radius, pathLength, currentLength) => {
  let vertices = [];
  let normals = [];
  let uvs = [];
  
  let dir1 = p2.clone().sub(p1);
  let dir2 = p3.clone().sub(p2);
  
  let length = p3.clone().sub(p1).length();
  //let globalCrossAxis = dir1.clone().normalize().cross(dir2.clone().normalize()).normalize();
  
  for(let k = 0; k < TUBE_TURN_SEGMENTS; k++) {
    let dx0 = k / TUBE_TURN_SEGMENTS;
    let dx1 = dx0 + (1.0 / TUBE_TURN_SEGMENTS);
    
    let curve1 = getCurvePoint(p1, p2, p3, radius, dx0);
    let curve2 = getCurvePoint(p1, p2, p3, radius, dx1);
    
    let point1 = p1.clone().add(curve1.clone());
    let point2 = p1.clone().add(curve2.clone());
  
    let d0 = dir1.clone().normalize().lerp(dir2.clone().normalize(), dx0);
    let d1 = dir1.clone().normalize().lerp(dir2.clone().normalize(), dx1);
    
    let v0 = (currentLength + length * dx0) / pathLength;
    let v1 = (currentLength + length * dx1) / pathLength;
    
    for (let i = 0; i < TUBE_SEGMENTS; i++) {
      /** First triangle */
      vertices.push(getCirclePoint(i, radius, point1, d0));
      vertices.push(getCirclePoint(i + 1, radius, point2, d1));
      vertices.push(getCirclePoint(i, radius, point2, d1));
  
      let axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
      let axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
      
      let normal = axis1.cross(axis2).normalize();
      // let normal2 = d1.clone().normalize().cross(globalCrossAxis.clone()).normalize();
      // let normal = normal1.add(normal2).normalize();
  
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
    
      uvs.push(i / TUBE_SEGMENTS, v0);
      uvs.push((i + 1) / TUBE_SEGMENTS, v1);
      uvs.push(i / TUBE_SEGMENTS, v1);
    
      /** Second triangle */
      
      vertices.push(getCirclePoint(i, radius, point1, d0));// 1
      vertices.push(getCirclePoint(i + 1, radius, point1, d0));// 2
      vertices.push(getCirclePoint(i + 1, radius, point2, d1));// 3
  
      axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
      axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
  
      normal = axis1.cross(axis2).normalize();
      // normal2 = d1.clone().normalize().cross(globalCrossAxis.clone()).normalize();
      // normal = normal1.add(normal2).normalize();
  
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      
      uvs.push((i + 1) / TUBE_SEGMENTS, v0);// 2
      uvs.push((i + 1) / TUBE_SEGMENTS, v1);// 3
      uvs.push(i / TUBE_SEGMENTS, v0);// 1
    }
  }
  
  return {
    vertices,
    normals,
    uvs
  }
};

const getTubeMap = (length) => {
  let canvas = document.createElement('canvas');
  let textureHeight = 32;
  let currentProgress = 0;
  
  canvas.width = 8;
  canvas.height = textureHeight;
  
  let ctx = canvas.getContext('2d');
  
  const map = new CanvasTexture(canvas, UVMapping, RepeatWrapping, RepeatWrapping, LinearFilter, LinearMipMapLinearFilter, RGBFormat);
  
  let dotSpace = 8;
  let dotLength = 4;
  
  map.repeat.setY((length * (dotSpace / textureHeight)));
  
  const setProgress = (dt) => {
    currentProgress = dt;
    
    map.offset.setY(-dt);
    
    map.needsUpdate = true;
  };
  
  const gen = () => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0,0, 8, textureHeight);
    //ctx.fillRect(0,(i + 1 - currentProgress) * 2, 8, 2);
    
    for (let i = 0; i <= textureHeight; i += dotSpace) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, i * dotSpace, 8, dotLength);
    }
    
    map.needsUpdate = true;
  };
  
  gen();
  
  const setLength = (value) => {
    let clampedLength = Math.max(8, _Math.ceilPowerOfTwo(value) * 2.0);
    
    canvas.width = 8;
    canvas.height = clampedLength;
  
    setProgress(currentProgress);
  };
  //setLength(Math.max(8, _Math.ceilPowerOfTwo(length) * 2.0));
  
  return {
    map,
    setLength,
    setProgress
  }
};

class Tube extends Object3D {
  
  radius = 1;
  path = [];
  pathLength = 0.01;
  flowControl = null;
  animation = null;
  
  constructor(radius = 1) {
    super();
    
    this.radius = radius;
  }
  
  getPointInfo(index) {
    if (!this.path[index]) {
      return null;
    }
    
    let pos = this.path[index].clone();
  
    let startLength = 0;
  
    for(let i = 1; i < index; i++) {
      startLength += this.path[i].clone().sub(this.path[i - 1]).length();
    }
  
    let endLength = startLength + this.path[index].clone().sub(this.path[index - 1]).length();
    
    let dir;
    if (this.path[index + 1]) {
      dir = this.path[index + 1].clone().sub(pos).normalize();
    } else {
      dir = pos.clone().sub(this.path[index - 1]).normalize();
    }
    
    return {
      pos, dir,
      startLength, endLength,
      firstFragment: index === 0,
      lastFragment: (index + 1) === (this.pathLength - 1),
    }
  }
  
  getPathPoint(dt) {
    let currentLength = 0;
    
    for(let i = 0; i < this.path.length - 1; i++) {
      let dist = this.path[i + 1].clone().sub(this.path[i]).length();
      let nextLenth = currentLength + dist;
      
      if ((nextLenth / this.pathLength) > dt) {
        //let dx = dist / this.pathLenth;
        let df = dt * this.pathLength;
        let dx = nextLenth - df;
        let delta = 1.0 - (dx / dist);
        
        let pos = this.path[i].clone().lerp(this.path[i + 1].clone(), delta);
        let dir = this.path[i + 1].clone().sub(this.path[i]).normalize();
        return {
          pos,
          dir,
          firstFragment: i === 0,
          lastFragment: (i + 1) === (this.path.length - 1)
        }
      }
  
      currentLength = nextLenth;
    }
    
    return null;
  }
  
  make() {
    if (this.path.length < 2) {
      return;
    }
    
    this.clear();
    
    const tubeLength = this.path.reduce((current, point, i, arr) => {
      if (i === 0) {
        return 0;
      }
      
      return current + point.clone().sub(arr[i - 1]).length();
    }, 0);
    let currentLength = 0;
    
    const geometry = new BufferGeometry();
    
    const vertices = [];
    const normals = [];
    const uvs = [];
    
    for(let i = 0; i < this.path.length - 1; i++) {
      let targetPoint = this.path[i];
      let nextPoint = this.path[i + 1];
      
      let from = targetPoint.clone();
      let to = nextPoint.clone();
      let dir = to.clone().sub(from).normalize();
      
      if (i > 0) {
        from.add(dir.clone().setLength(this.radius));
      }
      
      if ((i + 1) < (this.path.length - 1)) {
        to.sub(dir.clone().setLength(this.radius));
      }
      
      let data = getTubeGeometry(from, to, this.radius, tubeLength, currentLength);
      currentLength += targetPoint.distanceTo(to);
  
      data.vertices.forEach(({x, y, z}) => {
        vertices.push(x, y, z);
      });
  
      data.normals.forEach(({x, y, z}) => {
        normals.push(x, y, z);
      });
  
      uvs.push(...data.uvs);
  
      if ((i + 1) < (this.path.length - 1)) {
        let p1 = to.clone();
        let p2 = to.clone().add(dir.clone().setLength(this.radius));
        
        let nextDir = this.path[i + 2].clone().sub(p2).normalize();
        
        let p3 = p2.clone().add(nextDir.clone().multiplyScalar(this.radius));
        
        data = getTubeTurnGeometry(
            p1, p2, p3,
            this.radius,
            tubeLength,
            currentLength
        );

        data.vertices.forEach(({x, y, z}) => {
          vertices.push(x, y, z);
        });
  
        data.normals.forEach(({x, y, z}) => {
          normals.push(x, y, z);
        });

        uvs.push(...data.uvs);
      }
    }
  
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    
    //geometry.computeVertexNormals();
    // geometry.attributes.normal.needsUpdate = true;
  
    this.flowControl = getTubeMap(tubeLength);
    this.pathLength = tubeLength;
    
    const material = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 1.0,
      emissive: 0x0011ff,
      emissiveMap: this.flowControl.map,
      emissiveIntensity: 4.0,
      envMap: Manager.get().env['default'],
      side: DoubleSide,
    });
    
    material.needsUpdate = true;
    
    const mesh = new Mesh(geometry, material);
    
    this.add(mesh);
  
    this.animation = deltaTimeTween((progress) => {
      this.flowControl.setProgress(progress);
    }, 300, TWEEN.Easing.Linear.None).interpolation(TWEEN.Interpolation.Linear);
  
    let tweenTubeRepeat = deltaTimeTween((progress) => {
      this.flowControl.setProgress(progress);
    }, 300, TWEEN.Easing.Linear.None).interpolation(TWEEN.Interpolation.Linear);
  
    this.animation.chain(tweenTubeRepeat);
    tweenTubeRepeat.chain(this.animation);
  
    this.animation.start();
  }
  
  clone() {
    let clone = new Tube(this.radius);
    clone.path = this.path.map((v) => v.clone());
    
    clone.make();
    
    return clone;
  }
  
  clear() {
    while (this.children.length) {
      this.remove(this.children[0]);
    }
    
    if (this.animation) {
      this.animation.stop()
      this.animation = null;
    }
  }
  
  addPoint(v) {
    this.path.push(v);
  }
  
  dispose() {
    super.dispose();
    this.clear();
  }
}

export default Tube;
