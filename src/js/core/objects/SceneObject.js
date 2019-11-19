import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MeshPhongMaterial,
  Object3D,
  Box3,
  PointLight,
  Sphere, MeshStandardMaterial
} from "three";
import {BLOOM_LAYER} from "../../composer";
import Manager from './../resources';

class SceneObject extends Object3D {
  constructor(model = null) {
    super();
    
    this.model = model;
  }
  
  set model(target) {
    while (this.children.length) {
      let child = this.children[0];
      this.remove(child);

      child.dispose();
    }
    
    if (target) {
      let destModel = new Object3D();
      
      target.traverse((obj) => {
        if (obj.isMesh) {
          let targetModel = obj.clone();
  
          targetModel.material = new MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.0,
            metalness: 1.0,
            //emissive: 0x001122,
            transparent: false,
            opacity: 1.0,
            envMap: Manager.get().env['default']
          });
  
          // targetModel.material = new MeshStandardMaterial({
          //   color: 0x000000,
          //   roughness: 0.0,
          //   emissive: 0x001122,
          //   transparent: false,
          //   opacity: 1.0,
          //   envMap: Manager.get().env['default']
          // });
        
          let edges = new EdgesGeometry(targetModel.geometry);
          let line = new LineSegments(edges, new LineBasicMaterial({color: 0x0011ff, transparent: true, opacity: 0.92}));
          line.layers.set(BLOOM_LAYER);
  
          destModel.add(line);
          destModel.add(targetModel);
        }
      });
  
      let pointLight = new PointLight( 0x88aaff, 0.5, 50 );
      
      let sceneBox = new Box3().setFromObject(destModel);
      sceneBox.getCenter(pointLight.position);
      pointLight.position.y = sceneBox.max.y;
      
      let sphere = new Sphere();
      sceneBox.getBoundingSphere(sphere);
      
      pointLight.distance = sphere.radius * 4.0;
  
      this.add(destModel);
      this.add(pointLight);
    }
  }
  
  dispose() {
    this.model = null;
    super.dispose();
  }
  
  clone(recursive = true) {
    let clone;
    
    if (recursive && this.children[0]) {
      clone = new SceneObject(this.children[0].clone(recursive));
    } else {
      clone = new SceneObject();
    }
  
    clone.position.copy(this.position);
    clone.rotation.copy(this.rotation);
    clone.scale.copy(this.scale);
    
    return clone;
  }
}

export default SceneObject;
