import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

import {Layers, MeshBasicMaterial, ShaderMaterial, Vector2} from "three";

import CombineShader from './CombineShader';

export const DEFAULT_LAYER = 0;
export const BLOOM_LAYER = 1;

let bloomLayer = new Layers();
bloomLayer.set(BLOOM_LAYER);

const darkMaterial = new MeshBasicMaterial({color: 0x000000});
const materials = {};

export const Composer = (renderer, scene, camera) => {
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  
  const renderPass = new RenderPass(scene, camera);
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.renderToScreen = false;
  
  const hBlurPass = new ShaderPass(HorizontalBlurShader);
  hBlurPass.renderToScreen = false;
  
  const vBlurPass = new ShaderPass(VerticalBlurShader);
  vBlurPass.renderToScreen = false;
  
  const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.0, 0.0, 0.0);
  
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);
  // bloomComposer.addPass(vBlurPass);
  // bloomComposer.addPass(hBlurPass);
  //bloomComposer.addPass(fxaaPass);
  
  const finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: CombineShader.vertexSource,
        fragmentShader: CombineShader.fragmentSource,
        defines: {}
      }), "baseTexture"
  );
  finalPass.needsSwap = true;
  
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderPass);
  finalComposer.addPass(fxaaPass);
  finalComposer.addPass(finalPass);
  
  const setMaterialBlack = (obj) => {
    if (bloomLayer.test(obj.layers) === false && obj.material) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  };
  
  const restoreMaterial = (obj) => {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  };
  
  const render = () => {
    //camera.layers.disableAll();
    //camera.layers.set(BLOOM_LAYER);
    camera.layers.enable(BLOOM_LAYER);
    scene.traverse(setMaterialBlack);
    bloomComposer.render();
    scene.traverse(restoreMaterial);
    //camera.layers.enableAll();
    camera.layers.disable(BLOOM_LAYER);
    finalComposer.render();
  };
  
  const updateSize = () => {
    bloomComposer.setPixelRatio(window.devicePixelRatio);
    bloomComposer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  
    finalComposer.setPixelRatio(window.devicePixelRatio);
    finalComposer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( renderer.domElement.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( renderer.domElement.offsetHeight * pixelRatio );
    
    vBlurPass.material.uniforms[ 'v' ].value = fxaaPass.material.uniforms[ 'resolution' ].value.y * 0.2;
    hBlurPass.material.uniforms[ 'h' ].value = fxaaPass.material.uniforms[ 'resolution' ].value.x * 0.2;
  };
  
  return {
    render,
    updateSize
  };
}
