import EventEmitter from 'events';
import {
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  GridHelper,
  ReinhardToneMapping,
  PointLight,
  MeshPhongMaterial,
  Mesh,
  PlaneGeometry,
  Box3,
  Sphere,
  Line,
  BufferAttribute, Group, Vector3
} from "three";

import {MapControls} from './../vendor/OrbitControls';

import {Composer} from '../composer';
import ResourcesManager from './resources';

import SceneObject from './objects/SceneObject';
import Ground from "./objects/Ground";
import Tube from "./objects/Tube";

class Viewer extends EventEmitter {
  renderer = new WebGLRenderer();
  camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 999999);
  controls = new MapControls(this.camera, this.renderer.domElement);
  scene = new Scene();
  composer = new Composer(this.renderer, this.scene, this.camera);
  
  constructor() {
    super();
  
    //this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    //this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(-0.25, -0.25, -0.25);
  
    this.controls.update();
  
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMappingExposure = Math.pow(2.0, 2.0);
    this.renderer.toneMapping = ReinhardToneMapping;
    
    this.scene.background = new Color('#000000');//#404080
    
    let largePlant = new SceneObject(this.resources.models['large_plant'].clone());
    largePlant.scale.set(0.25, 0.25, 0.25);
    largePlant.position.set(4.5, 0, 4);
  
    let portPlant = new SceneObject(this.resources.models['demo_plant'].clone());
    portPlant.scale.set(0.75, 0.75, 0.75);
    portPlant.position.set(24, 0, -7.5);
    
    this.scene.add(largePlant);
    this.scene.add(portPlant);
    
    let targetShip1 = new SceneObject(this.resources.models['demo_ship'].clone());
    targetShip1.position.z = 1.0;
   
    let targetShip2 = targetShip1.clone();
    targetShip2.position.z = -5.0;
    
    
    let Ships = new Group();
    Ships.position.set(29, 0, 0);
  
    Ships.add(targetShip1);
    Ships.add(targetShip2);
    
    this.scene.add(Ships);
    
    let ground = new Ground();
    this.scene.add(ground);
    
    let testTube = new Tube(0.1);
    
    testTube.addPoint(new Vector3(6.5, 0, 4));
    testTube.addPoint(new Vector3(6.5, 0.5, 4));
    testTube.addPoint(new Vector3(16, 0.5, 4));
    testTube.addPoint(new Vector3(16, 0.5, -2));
    testTube.addPoint(new Vector3(24.5, 0.5, -2));
    testTube.addPoint(new Vector3(24.5, 0, -2));
    
    testTube.make();
    
    let testTube2 = testTube.clone();
    testTube2.position.x = 0.2;
    testTube2.position.z = 0.2;
    
    let testTube3 = testTube.clone();
    testTube3.position.x = 0.4;
    testTube3.position.z = 0.4;
    
    this.scene.add(testTube);
    this.scene.add(testTube2);
    this.scene.add(testTube3);
    
    this.controls.clampInstance(largePlant);
    this.controls.update();
  
    window.addEventListener('resize', this.updateSize);
    requestAnimationFrame(this.render);
  }
  
  updateSize = () => {
    const parent = this.canvas.parentNode;
    if (parent) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
  
      this.camera.aspect = parent.clientWidth / parent.clientHeight;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(parent.clientWidth, parent.clientHeight);
      this.composer.updateSize();
    }
  };
  
  get canvas() {
    return this.renderer.domElement;
  }
  
  get resources() {
    return ResourcesManager.get();
  }
  
  render = (time) => {
    requestAnimationFrame(this.render);
    
    //this.renderer.render(this.scene, this.camera);
    this.composer.render();
  };
  
  dispose() {
    cancelAnimationFrame(this.render);
    window.removeEventListener('resize', this.updateSize);
  }
  
  static preload(staticPath, onProgress) {
    return ResourcesManager.load(staticPath, onProgress).then(() => new Viewer());
  }
}

export default Viewer;
