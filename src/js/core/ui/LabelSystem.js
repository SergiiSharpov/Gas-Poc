import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  Matrix4,
  CanvasTexture,
  UVMapping,
  ClampToEdgeWrapping,
  NearestFilter,
  LinearMipMapLinearFilter,
  LinearFilter,
  RGBFormat,
  UnsignedByteType, RGBAFormat
} from "three";

const placeholderFunc = () => {};

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}

class LabelSystem {
  labels = [];
  size = new Vector2(window.innerWidth, window.innerHeight);
  camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
  scene = new Scene();
  originCamera = null;
  
  setCamera(camera) {
    this.originCamera = camera;
  }
  
  addLabel(position = new Vector3(), size = new Vector2(), onDraw = placeholderFunc) {
    let geometry = new PlaneGeometry(size.x, size.y, 1, 1);
    
    const canvas = document.createElement('canvas');
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');
    
    let material = new MeshBasicMaterial({
      color: 0xffffff, //side: DoubleSide,
      map: new CanvasTexture(canvas, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, NearestFilter, LinearFilter, RGBAFormat, UnsignedByteType, 0),
      transparent: true,
      opacity: 1.0
    });
    let plane = new Mesh(geometry, material);
    
    this.scene.add(plane);
    
    const current = {
      position,
      size,
      onDraw,
      plane,
      canvas,
      ctx
    };
    
    console.log(current);
    
    this.labels.push(current);
    
    return current;
  }
  
  setSize(w, h) {
    const aspect = w / h;
    
    this.camera.left = -h * aspect / 2;
    this.camera.right = h * aspect / 2;
    this.camera.top = h / 2;
    this.camera.bottom = - h / 2;
    this.camera.updateProjectionMatrix();
  }
  
  update() {
    for (let label of this.labels) {
      label.onDraw(label.canvas, label.ctx, label.plane.material.map, label);
      
      let pos = label.position.clone().project(this.originCamera);
      
      // console.clear();
      // console.log(pos)
      
      label.plane.position.x = pos.x * this.camera.right;
      label.plane.position.y = pos.y * this.camera.top;
      label.plane.position.z = pos.z * -1000;
      
      label.plane.scale.set(pos.z, pos.z, pos.z);

      label.plane.updateMatrix();
    }
  }
}

export default new LabelSystem();
