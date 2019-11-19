import {
  CylinderBufferGeometry,
  Mesh,
  MeshPhongMaterial,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  Vector2,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Group,
  MeshStandardMaterial,
  BackSide,
  Quaternion,
  BufferGeometry,
  BufferAttribute, DoubleSide, CanvasTexture,
  Math as _Math, UVMapping, ClampToEdgeWrapping, Float32BufferAttribute, RepeatWrapping, Matrix4
} from "three";
import {BLOOM_LAYER} from "../../composer";
import Manager from "../resources";

const TUBE_SEGMENTS = 16;
const TUBE_TURN_SEGMENTS = 8;
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
  
  let angleTo = axis1.clone().angleTo(axis2.clone());
  
  return axis1.clone().applyAxisAngle(cross, angleTo * dt).sub(axis1);
};

const getTubeTurnGeometry = (p1, p2, p3, radius, pathLength, currentLength) => {
  let vertices = [];
  let normals = [];
  let uvs = [];
  
  let dir1 = p2.clone().sub(p1);
  let dir2 = p3.clone().sub(p2);
  
  let length = p3.clone().sub(p1).length();
  
  // let v0 = currentLength / pathLength;
  // let v1 = (currentLength + direction.length()) / pathLength;
  
  for(let k = 0; k < TUBE_TURN_SEGMENTS; k++) {
    let dx0 = k / TUBE_TURN_SEGMENTS;
    let dx1 = (k + 1) / TUBE_TURN_SEGMENTS;
    
    let curve1 = getCurvePoint(p1, p2, p3, radius, dx0);
    let curve2 = getCurvePoint(p1, p2, p3, radius, dx1);
    
    let point1 = p1.clone().add(curve1.clone());
    let point2 = p1.clone().add(curve2.clone());
  
    let d0 = dir1.clone().lerp(dir2.clone(), dx0);
    let d1 = dir1.clone().lerp(dir2.clone(), dx1);
    
    let v0 = (currentLength + length * dx0) / pathLength;
    let v1 = (currentLength + length * dx1) / pathLength;
    
    for (let i = 0; i < TUBE_SEGMENTS; i++) {
      /** First triangle */
      vertices.push(getCirclePoint(i, radius, point1, d0));
      vertices.push(getCirclePoint(i, radius, point2, d1));
      vertices.push(getCirclePoint(i + 1, radius, point1, d0));
  
      let axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
      let axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
      let normal = axis1.cross(axis2);
  
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
    
      uvs.push(i / TUBE_SEGMENTS, v0);
      uvs.push(i / TUBE_SEGMENTS, v1);
      uvs.push((i + 1) / TUBE_SEGMENTS, v0);
    
      /** Second triangle */
      vertices.push(getCirclePoint(i + 1, radius, point1, d0));// 2
      vertices.push(getCirclePoint(i, radius, point2, d1));// 1
      vertices.push(getCirclePoint(i + 1, radius, point2, d1));// 3
  
      axis1 = vertices[vertices.length - 1].clone().sub(vertices[vertices.length - 3]);
      axis2 = vertices[vertices.length - 2].clone().sub(vertices[vertices.length - 3]);
      normal = axis1.cross(axis2);
  
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      normals.push(normal.clone().negate());
      
      uvs.push((i + 1) / TUBE_SEGMENTS, v0);// 2
      uvs.push(i / TUBE_SEGMENTS, v1);// 1
      uvs.push((i + 1) / TUBE_SEGMENTS, v1);// 3
    }
  }
  
  return {
    vertices,
    normals,
    uvs
  }
};

const getTubeMap = (length) => {
  let clampedLength = Math.max(8, _Math.ceilPowerOfTwo(length) * 2.0);
  let canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = clampedLength;
  
  let ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0, 8, clampedLength);
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0,0, 8, clampedLength * 0.97);
  
  return new CanvasTexture(canvas, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping);
};

class Tube extends Object3D {
  
  radius = 1;
  path = [];
  
  constructor(radius = 1) {
    super();
    
    this.radius = radius;
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
        from.add(dir.clone().multiplyScalar(this.radius));
      }
      
      if ((i + 1) < (this.path.length - 1)) {
        to.sub(dir.clone().multiplyScalar(this.radius));
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
        let p2 = to.clone().add(dir.clone().multiplyScalar(this.radius));
        
        let nextDir = this.path[i + 2].clone().sub(p2).normalize();
        
        let p3 = p2.clone().add(nextDir.multiplyScalar(this.radius));
        
        data = getTubeTurnGeometry(
            p1, p2, p3,
            this.radius,
            tubeLength,
            currentLength
        );
        currentLength += targetPoint.distanceTo(to);

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
    
    const material = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.0,
      metalness: 0.0,
      //emissive: 0x001122,
      transparent: true,
      opacity: 1.0,
      //depthTest: false,
      envMap: Manager.get().env['default'],
      //side: DoubleSide,
      //alphaMap: getTubeMap(tubeLength)
    });
    
    material.needsUpdate = true;
    
    const mesh = new Mesh(geometry, material);
    
    this.add(mesh);
  
    let edges = new EdgesGeometry(geometry);
    let line = new LineSegments(edges, new LineBasicMaterial({color: 0x0011ff, transparent: true, opacity: 0.4}));
    //line.scale.set(1.02, 1.0, 1.02);
  
    line.layers.set(BLOOM_LAYER);
    this.add(line);
  }
  
  getTubeObject(from, to) {
    let result = new Group();
    let height = from.clone().distanceTo(to);
    
    let geom = new CylinderBufferGeometry(this.radius, this.radius, height, 24);
    geom.translate(0, height * 0.5, 0);
    let mat = new MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.0,
      metalness: 0.5,
      //emissive: 0x001122,
      transparent: false,
      opacity: 1.0,
      //envMap: Manager.get().env['default'],
      //side: BackSide
    });
    let mesh = new Mesh(geom, mat);
  
    let edges = new EdgesGeometry(geom);
    let line = new LineSegments(edges, new LineBasicMaterial({color: 0x0011ff, transparent: true, opacity: 0.4}));
    line.scale.set(1.02, 1.0, 1.02);
    
    line.layers.set(BLOOM_LAYER);
  
    result.add(mesh);
    result.add(line);
  
    result.position.copy(from);
    result.quaternion.setFromUnitVectors(result.up, to.clone().sub(from).normalize());
    
    return result;
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
  }
  
  addPoint(v) {
    this.path.push(v);
  }
}

export default Tube;
