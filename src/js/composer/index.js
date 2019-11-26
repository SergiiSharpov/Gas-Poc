import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import LabelSystem from './../core/ui/LabelSystem';

export const BLOOM_LAYER = 1;

export const Composer = (renderer, scene, camera) => {
  
  const bloomComposer = new EffectComposer(renderer);
  const lab = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  
  const renderLabels = new RenderPass(LabelSystem.scene, LabelSystem.camera);
  renderLabels.clear = false;
  renderLabels.clearDepth = true;
  
  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.clear = false;
  
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(fxaaPass);
  lab.addPass(renderLabels);
  
  const render = () => {
    bloomComposer.render();
    lab.render();
  };
  
  const updateSize = () => {
    bloomComposer.setPixelRatio(window.devicePixelRatio);
    bloomComposer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  
    const pixelRatio = window.devicePixelRatio;
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( renderer.domElement.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( renderer.domElement.offsetHeight * pixelRatio );
  };
  
  return {
    render,
    updateSize
  };
}
