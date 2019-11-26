import EventEmitter from 'events';
import {
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  ReinhardToneMapping,
  Group,
  Vector3,
  Clock,
  Vector2,
  FogExp2,
  SpotLight,
  Raycaster
} from "three";
import TWEEN from '@tweenjs/tween.js';

import {MapControls} from './../vendor/OrbitControls';

import {Composer} from '../composer';
import ResourcesManager from './resources';

import LabelSystem from './ui/LabelSystem';

import SceneObject from './objects/SceneObject';
import Ground from "./objects/Ground";
import Tube from "./objects/Tube";

class Viewer extends EventEmitter {
  renderer = new WebGLRenderer({
    //antialias: true,
    logarithmicDepthBuffer: true
  });
  camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 4000);
  controls = new MapControls(this.camera, this.renderer.domElement);
  scene = new Scene();
  composer = new Composer(this.renderer, this.scene, this.camera);
  
  raycaster = new Raycaster();
  mouse = new Vector2();
  
  groundPlane = null;
  
  dirLight = new SpotLight(0x88aaff, 0.75, 0, Math.PI / 2.0, 1.99);
  
  clock = new Clock();
  
  objects = {
    drills: [],
    pumps: [],
    smallPlants: [],
    bigPlants: [],
    port: null,
    ship: null
  };
  
  systemSpeed = 0.0025;
  
  totalProgress = {
    loads: 0,
    mainPlant: 0,
    subPlant: 0
  };
  
  tubeFlow = {
    prev: 0.2,
    current: 0.2,
    target: 0.2
  }
  
  smallPlantPower = {
    prev: 0.8,
    current: 0.8,
    target: 0.8
  }
  
  smallPlantUtil = {
    prev: 0.8,
    current: 0.8,
    target: 0.8
  }
  
  constructor() {
    super();
    
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0.25, -0.25, -0.25);
  
    this.controls.update();
  
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMappingExposure = Math.pow(2.0, 2.0);
    this.renderer.toneMapping = ReinhardToneMapping;
    this.renderer.sortObjects = false;
    this.renderer.autoClear = false;
  
    LabelSystem.setCamera(this.camera);
  
    this.scene.background = new Color('#000000');//#404080
    this.scene.fog = new FogExp2(0x000000, 0.0025);
    
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
    
    this.initDemoScene();
    
    this.controls.clampInstance(this.scene, this.dirLight);
    this.controls.update();
    this.camera.updateMatrixWorld();
  
    this.groundPlane = new Ground();
    this.scene.add(this.groundPlane);
  
    window.addEventListener('resize', this.updateSize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    
    requestAnimationFrame(this.render);
  }
  
  onMouseMove = (event) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  
  onMouseDown = () => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
  
    const intersects = this.raycaster.intersectObjects([this.groundPlane], true);
  
    for (let i = 0; i < intersects.length; i++) {
    
      console.clear();
      console.log(intersects[i].point);
    
    }
  };
  
  initDemoScene() {
   this.initDrills();
   this.initSmallPlants();
   this.initBigPlants();
   this.initPort();
   this.initShip();
   
   this.initLabels();
  }
  
  initLabels() {
    LabelSystem.addLabel(
        new Vector3(35, 6, 8),
        new Vector2(64, 24),
        ({width, height}, ctx, map) => {
          ctx.clearRect(0, 0, width, height);
          
          ctx.fillStyle = '#ffffff';
          ctx.roundRect(0, 0, width, height, 5).fill();
          //ctx.fillRect(0, 0, width, height);
  
          ctx.fillStyle = '#000000';
          ctx.font = "16px LabelRoboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(`${(this.totalProgress.mainPlant * 100).toFixed(0)}%`, width * 0.5, height - 20);
  
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, height - 4, width, 4);
          
          ctx.fillStyle = '#0088ff';
          ctx.fillRect(0, height - 4, width * this.totalProgress.mainPlant, 4);
          
          map.needsUpdate = true;
        }
    );
  
    LabelSystem.addLabel(
        new Vector3(),
        new Vector2(48, 20),
        ({width, height}, ctx, map, label) => {
          this.objects.ship.children[0].getWorldPosition(label.position);
          label.position.y = 8;
          label.plane.material.opacity = this.objects.ship.children[0].material.opacity;
        
          ctx.clearRect(0, 0, width, height);
        
          ctx.fillStyle = '#ffffff';
          ctx.roundRect(0, 0, width, height, 5).fill();
        
          ctx.fillStyle = '#000000';
          ctx.font = "14px LabelRoboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(`${(this.totalProgress.loads * 100).toFixed(0)}%`, width * 0.5, height - 18);
        
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, height - 4, width, 4);
        
          ctx.fillStyle = '#0088ff';
          ctx.fillRect(0, height - 4, width * this.totalProgress.loads, 4);
        
          map.needsUpdate = true;
        }
    );
  
    LabelSystem.addLabel(
        new Vector3(-16, 3, -16),
        new Vector2(32, 20),
        ({width, height}, ctx, map, label) => {
          ctx.clearRect(0, 0, width, height);
        
          ctx.fillStyle = '#ffffff';
          ctx.roundRect(0, 0, width, height, 5).fill();
        
          ctx.fillStyle = '#000000';
          ctx.font = "14px LabelRoboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText((this.tubeFlow.target * 100).toFixed(0), width * 0.5, height - 18);
        
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, height - 4, width, 4);
        
          ctx.fillStyle = '#0088ff';
          ctx.fillRect(0, height - 4, width * this.tubeFlow.target, 4);
        
          map.needsUpdate = true;
        }
    );
  
    LabelSystem.addLabel(
        new Vector3(-30, 14, -8),
        new Vector2(64, 36),
        ({width, height}, ctx, map, label) => {
          ctx.clearRect(0, 0, width, height);
        
          ctx.fillStyle = '#ffffff';
          ctx.roundRect(0, 0, width, height, 5).fill();
        
          ctx.fillStyle = '#0f9c18';
          ctx.fillRect(0, 2, width * this.smallPlantPower.target, 16);
          
          ctx.fillStyle = '#0088ff';
          ctx.fillRect(0, 16, width * this.smallPlantUtil.target, 16);
        
          ctx.fillStyle = '#000000';
          ctx.font = "12.5px LabelRoboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
        
          ctx.fillText("TR-1", width * 0.5, 4);
          ctx.fillText(`Util: ${(this.smallPlantUtil.target * 100).toFixed(0)}%`, width * 0.5, 20);
        
          map.needsUpdate = true;
        }
    );
  
    LabelSystem.addLabel(
        new Vector3(22, 22, -31),
        new Vector2(128, 64),
        ({width, height}, ctx, map, label) => {
          ctx.clearRect(0, 0, width, height);
        
          ctx.fillStyle = '#ffffff';
          ctx.roundRect(0, 0, width, height, 5).fill();
        
          ctx.fillStyle = '#888888';
          ctx.fillRect(4, 4, 58, 16);
          ctx.fillRect(4, 24, 58, 16);
          ctx.fillRect(66, 4, 58, 16);
          ctx.fillRect(66, 24, 58, 16);
          
          ctx.fillRect(0, 48, width, 16);
          
          let tr1 = this.smallPlantPower.target;
          let tr2 = (this.smallPlantPower.target + this.tubeFlow.target) / 2.0;
          let tr3 = (tr1 + tr2 + this.totalProgress.loads) / 3.0;
          let tr4 = (tr1 + tr2 + tr3) / 3.0;
          let utils = (this.smallPlantUtil.target + tr1 + tr2 + tr3 + tr4 + this.totalProgress.mainPlant) / 6.0;
        
          ctx.fillStyle = '#0f9c18';
          ctx.fillRect(4, 4, 58 * tr1, 16);
          ctx.fillRect(4, 24, 58 * tr2, 16);
          ctx.fillRect(66, 4, 58 * tr3, 16);
          ctx.fillRect(66, 24, 58 * tr4, 16);
        
          ctx.fillStyle = '#0088ff';
          ctx.fillRect(0, 48, width * utils, 16);
        
          ctx.fillStyle = '#000000';
          ctx.font = "12.5px LabelRoboto";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
        
          ctx.fillText("TR-1", 34, 8);
          ctx.fillText("TR-2", 94, 8);
          ctx.fillText("TR-3", 34, 28);
          ctx.fillText("TR-4", 94, 28);
          
          ctx.fillText(`Util: ${(utils * 100).toFixed(0)}%`, width * 0.5, 52);
        
          map.needsUpdate = true;
        }
    );
  }
  
  initShip() {
    let ship = new Group();
    let shipModel = new SceneObject(this.resources.models['ship']);
    shipModel.scale.set(0.05, 0.05, 0.05);
    shipModel.position.set(47, 0.5, 33);
    
    
    let showTween = new TWEEN.Tween([0]).to([1], 1000).onUpdate(([dt]) => {
      ship.position.x = 16.0 * (1.0 - dt);
      shipModel.material.opacity = dt;
  
      this.tubeFlow.target = this.tubeFlow.prev + (this.tubeFlow.current - this.tubeFlow.prev) * dt;
      this.smallPlantPower.target = this.smallPlantPower.prev + (this.smallPlantPower.current - this.smallPlantPower.prev) * dt;
      this.smallPlantUtil.target = this.smallPlantUtil.prev + (this.smallPlantUtil.current - this.smallPlantUtil.prev) * dt;
    })
    .onStart(() => {
      this.tubeFlow.prev = this.tubeFlow.target;
      this.tubeFlow.current = 0.4 + Math.round(Math.random() * 40) / 100.0;
  
      this.smallPlantPower.prev = this.smallPlantPower.target;
      this.smallPlantPower.current = 0.6 + Math.round(Math.random() * 40) / 100.0;
  
      this.smallPlantUtil.prev = this.smallPlantUtil.target;
      this.smallPlantUtil.current = 0.7 + Math.round(Math.random() * 30) / 100.0;
    })
    .easing(TWEEN.Easing.Quadratic.Out)
    .interpolation(TWEEN.Interpolation.Bezier);
    
    
    
    let idleTween = new TWEEN.Tween([0]).to([1], 2000).onUpdate(([dt]) => {
      this.totalProgress.loads = dt;
      this.totalProgress.mainPlant = Math.max(this.totalProgress.mainPlant - this.systemSpeed * 2.0, 0);
  
      this.tubeFlow.target = this.tubeFlow.prev + (this.tubeFlow.current - this.tubeFlow.prev) * dt;
      this.smallPlantPower.target = this.smallPlantPower.prev + (this.smallPlantPower.current - this.smallPlantPower.prev) * dt;
      this.smallPlantUtil.target = this.smallPlantUtil.prev + (this.smallPlantUtil.current - this.smallPlantUtil.prev) * dt;
    }).onStart(() => {
      this.tubeFlow.prev = this.tubeFlow.target;
      this.tubeFlow.current = 0.5 + Math.round(Math.random() * 50) / 100.0;
  
      this.smallPlantPower.prev = this.smallPlantPower.target;
      this.smallPlantPower.current = 0.8 + Math.round(Math.random() * 20) / 100.0;
  
      this.smallPlantUtil.prev = this.smallPlantUtil.target;
      this.smallPlantUtil.current = 0.9 + Math.round(Math.random() * 10) / 100.0;
    });
    
    
    
    let hideTween = new TWEEN.Tween([0]).to([1], 1000).onUpdate(([dt]) => {
      ship.position.x = -16.0 * dt;
      shipModel.material.opacity = 1.0 - dt;
      this.totalProgress.loads = 1.0 - dt;
      
      this.tubeFlow.target = this.tubeFlow.prev + (this.tubeFlow.current - this.tubeFlow.prev) * dt;
      this.smallPlantPower.target = this.smallPlantPower.prev + (this.smallPlantPower.current - this.smallPlantPower.prev) * dt;
      this.smallPlantUtil.target = this.smallPlantUtil.prev + (this.smallPlantUtil.current - this.smallPlantUtil.prev) * dt;
    })
    .onStart(() => {
      this.tubeFlow.prev = this.tubeFlow.target;
      this.tubeFlow.current = 0.1 + Math.round(Math.random() * 20) / 100.0;
  
      this.smallPlantPower.prev = this.smallPlantPower.target;
      this.smallPlantPower.current = 0.5 + Math.round(Math.random() * 50) / 100.0;
  
      this.smallPlantUtil.prev = this.smallPlantUtil.target;
      this.smallPlantUtil.current = 0.6 + Math.round(Math.random() * 40) / 100.0;
    })
    .easing(TWEEN.Easing.Quadratic.In)
    .interpolation(TWEEN.Interpolation.Bezier);
    
    
    
    let sleepTween = new TWEEN.Tween([0]).to([1], 2000)
    .onUpdate(([dt]) => {
      this.tubeFlow.target = this.tubeFlow.prev + (this.tubeFlow.current - this.tubeFlow.prev) * dt;
      this.smallPlantPower.target = this.smallPlantPower.prev + (this.smallPlantPower.current - this.smallPlantPower.prev) * dt;
      this.smallPlantUtil.target = this.smallPlantUtil.prev + (this.smallPlantUtil.current - this.smallPlantUtil.prev) * dt;
    })
    .onStart(() => {
      this.tubeFlow.prev = this.tubeFlow.target;
      this.tubeFlow.current = 0.2 + Math.round(Math.random() * 20) / 100.0;
  
      this.smallPlantPower.prev = this.smallPlantPower.target;
      this.smallPlantPower.current = 0.5 + Math.round(Math.random() * 50) / 100.0;
  
      this.smallPlantUtil.prev = this.smallPlantUtil.target;
      this.smallPlantUtil.current = 0.6 + Math.round(Math.random() * 40) / 100.0;
    });
    
    showTween.chain(idleTween);
    idleTween.chain(hideTween);
    hideTween.chain(sleepTween);
    sleepTween.chain(showTween);
  
    showTween.start();
  
    ship.add(shipModel);
    this.scene.add(ship);
    
    this.objects.ship = ship;
  }
  
  initPort() {
    let port = new SceneObject(this.resources.models['port']);
    port.scale.set(0.05, 0.05, 0.05);
    port.rotation.y = Math.PI * 0.5;
    port.position.set(35, 0, 16);
    
    this.scene.add(port);
  }
  
  initBigPlants() {
    let bigPlant01 = new SceneObject(this.resources.models['largePlant']);
    bigPlant01.scale.set(24, 24, 24);
    bigPlant01.rotation.y = -Math.PI * 0.5;
    bigPlant01.position.set(22, -24, -31);
  
    let bigPlant01Tube = new Tube(0.5);
    bigPlant01Tube.addPoint(new Vector3(19.5, 1.0, -26));
    bigPlant01Tube.addPoint(new Vector3(19.5, 1.0, -8));
    bigPlant01Tube.addPoint(new Vector3(30, 1.0, -8));
    bigPlant01Tube.addPoint(new Vector3(30, 1.0, 0));
    bigPlant01Tube.addPoint(new Vector3(30, -1.0, 0));
    bigPlant01Tube.make();
  
    this.scene.add(bigPlant01);
    this.scene.add(bigPlant01Tube);
    
    this.objects.bigPlants.push(bigPlant01);
  }
  
  initSmallPlants() {
    let smallPlant01 = new SceneObject(this.resources.models['smallPlant']);
    smallPlant01.scale.set(14, 14, 14);
    smallPlant01.position.set(-30, -14, -8);
  
    let smallPlant01Tube = new Tube(0.3);
    smallPlant01Tube.addPoint(new Vector3(-27, 0.45, -6));
    smallPlant01Tube.addPoint(new Vector3(-20, 0.45, -6));
    smallPlant01Tube.addPoint(new Vector3(-20, 0.45, -16));
    smallPlant01Tube.addPoint(new Vector3(-12, 0.45, -16));
    smallPlant01Tube.addPoint(new Vector3(-12, 0.45, -30));
    smallPlant01Tube.addPoint(new Vector3(18, 0.45, -30));
    smallPlant01Tube.make();

    this.scene.add(smallPlant01);
    this.scene.add(smallPlant01Tube);
  }
  
  initDrills() {
    let drill01 = new SceneObject(this.resources.models['drill']);
    drill01.scale.set(0.0002, 0.0002, 0.0002);
    drill01.rotation.y = -Math.PI * 0.5;
    drill01.position.set(-34, 0, 3);
    drill01.play();
  
    let drill01Tube = new Tube(0.1);
    drill01Tube.addPoint(new Vector3(-33, 0.1, 3.2));
    drill01Tube.addPoint(new Vector3(-27, 0.1, 3.2));
    drill01Tube.addPoint(new Vector3(-27, 0.1, -6));
    drill01Tube.addPoint(new Vector3(-24, 0.1, -6));
    drill01Tube.make();
  
  
    let drill02 = new SceneObject(this.resources.models['drill']);
    drill02.scale.set(0.0002, 0.0002, 0.0002);
    drill02.position.set(-33, 0, 6);
    drill02.rotation.y = -Math.PI * 0.5;
    drill02.animationOffset = 0.3;
    drill02.play();
  
    let drill02Tube = new Tube(0.1);
    drill02Tube.addPoint(new Vector3(-32, 0.1, 6.1));
    drill02Tube.addPoint(new Vector3(-26.8, 0.1, 6.1));
    drill02Tube.addPoint(new Vector3(-26.8, 0.1, -5.8));
    drill02Tube.addPoint(new Vector3(-24, 0.1, -5.8));
    drill02Tube.make();
    
    let drillsGroup = new Group();
    
    drillsGroup.add(drill01);
    drillsGroup.add(drill02);
    
    this.objects.drills.push(drill01, drill02);
    
    drillsGroup.add(drill01Tube);
    drillsGroup.add(drill02Tube);
    
    drillsGroup.position.x = -8;
    
    this.scene.add(drillsGroup);
  }
  
  updateSize = () => {
    const parent = this.canvas.parentNode;
    if (parent) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
  
      this.camera.aspect = parent.clientWidth / parent.clientHeight;
      this.camera.updateProjectionMatrix();
      
      LabelSystem.setSize(parent.clientWidth, parent.clientHeight);
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
  
    TWEEN.update(time);
    
    for (let child of this.objects.drills) {
      child.updateMixer(this.clock.getDelta())
    }
    
    this.totalProgress.mainPlant = Math.min(this.totalProgress.mainPlant + this.systemSpeed, 1.0);
  
    LabelSystem.update();
    
    this.composer.render();
  };
  
  dispose() {
    cancelAnimationFrame(this.render);
    window.removeEventListener('resize', this.updateSize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
  }
  
  static preload(staticPath, onProgress) {
    return ResourcesManager.load(staticPath, onProgress).then(() => new Viewer());
  }
}

export default Viewer;
