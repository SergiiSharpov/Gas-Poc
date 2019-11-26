import {
  AdditiveBlending,
  AlwaysDepth,
  DoubleSide, EqualDepth,
  GreaterDepth,
  GreaterEqualDepth, LessEqualDepth,
  ShaderMaterial,
  Vector3
} from "three";

const GlowShader = {
  vertexSource:`
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
        
        vec4 viewPosition = modelViewMatrix * vec4( position, 1.0 );
        vec4 viewCameraPosition = projectionMatrix * modelMatrix * vec4(cameraPosition, 1.0);
        vec3 viewNormal = normalize(mat3( modelViewMatrix[0].xyz, modelViewMatrix[1].xyz, modelViewMatrix[2].xyz ) * normal);
        
        vNormal = viewNormal;
        vPosition = normalize(viewPosition.xyz);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentSource: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vec3 viewDir = (viewMatrix * vec4(cameraPosition, 1.0)).xyz - vPosition;
      float fresnel = 0.02 + 1.0 * pow(1.0 - saturate(dot(vNormal, viewDir)), 2.0);
      
      gl_FragColor = vec4(vec3(0.0, 0.1, 1.0) * fresnel, fresnel);
    }
  `,
  uniforms: {
    glowColor: { value: null }
  }
};

export default () => {
  let material = new ShaderMaterial({
    vertexShader: GlowShader.vertexSource,
    fragmentShader: GlowShader.fragmentSource,
    //side: DoubleSide,
    //depthTest: false,
    transparent: true,
    //alphaTest: 0.8,
    //opacity: 0.7,
    //blending: AdditiveBlending,
    //depthWrite: false,
    depthFunc: LessEqualDepth,
    //polygonOffset: true,
    //polygonOffsetFactor: -1,
    //polygonOffsetUnits: 1
  });
  
  material.extensions.derivatives = true;
  
  return material;
};
