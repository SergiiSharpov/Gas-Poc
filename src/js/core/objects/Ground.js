import {
  BufferAttribute,
  CanvasTexture,
  GridHelper,
  Line,
  Mesh, MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PlaneGeometry, RepeatWrapping, UVMapping
} from "three";
import {BLOOM_LAYER} from "../../composer";

class Ground extends Object3D {
  constructor() {
    super();
  
    let grid = new GridHelper( 200, 160, 0x0088ff, 0x0088ff);
    const normals = grid.geometry.attributes.position.clone().array.map((v, i) => {
      if (i % 3 === 1) {
        return 1.0;
      }
    
      return 0.0;
    });
    grid.geometry.setAttribute( 'normal', new BufferAttribute(normals, 3));
    let gridMesh = new Line(grid.geometry.clone(), new MeshPhongMaterial({color: 0x84ccff}));
  
    let floorMesh = new Mesh(new PlaneGeometry(200, 200), new MeshPhongMaterial({shininess: 0, map: this.getCanvasTexture()}));
    floorMesh.position.y = -0.1;
    floorMesh.rotation.x = -Math.PI * 0.5;
    
    this.add(floorMesh);
    //this.add(gridMesh);
  
    // floorMesh.layers.set(BLOOM_LAYER);
    // gridMesh.layers.set(BLOOM_LAYER);
  }
  
  getCanvasTexture() {
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
    map.repeat.set(250, 250);
    map.needsUpdate = true;
    
    return map;
  }
}

export default Ground;
