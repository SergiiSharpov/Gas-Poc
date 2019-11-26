import {
  AlwaysDepth,
  BufferAttribute,
  CanvasTexture, DoubleSide, GreaterDepth, GreaterEqualDepth,
  GridHelper, LessDepth,
  Line,
  Mesh, MeshBasicMaterial,
  MeshPhongMaterial, MeshStandardMaterial, NeverDepth, NotEqualDepth,
  Object3D, PlaneBufferGeometry,
  PlaneGeometry, RepeatWrapping, UVMapping
} from "three";
import {BLOOM_LAYER} from "../../composer";

class Ground extends Object3D {
  constructor() {
    super();
  
    let floorMaterial = new MeshStandardMaterial({
      metalness: 0.0,
      roughness: 0.8,
      //emissive: 0x111111,
      map: Ground.getCanvasTexture(),
      // polygonOffset: true,
      // polygonOffsetFactor: 1,
      //depthFunc: LessDepth
    });
    let floorMesh = new Mesh(new PlaneBufferGeometry(1000, 1000, 24, 24), floorMaterial);
    //floorMesh.position.y = -0.1;
    floorMesh.rotation.x = -Math.PI * 0.5;
  
    floorMesh.frustumCulled = false;
    this.frustumCulled = false;
    
    this.add(floorMesh);
  }
  
  static getCanvasTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
  
    let ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0088ff';
    ctx.fillStyle = '#ffffff';
  
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);
  
    ctx.lineWidth = 1;
    
    let dx = 16;
    let dt = 512 / dx;
    for (let x = 0; x < dx; x++) {
      for(let y = 0; y < dx; y++) {
        ctx.strokeRect(x * dt, y * dt, dt, dt);
      }
    }
  
    let map = new CanvasTexture(canvas, UVMapping, RepeatWrapping, RepeatWrapping);
    map.repeat.set(1000, 1000);
    map.needsUpdate = true;
    
    return map;
  }
}

export default Ground;
