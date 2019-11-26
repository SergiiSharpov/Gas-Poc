import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MeshPhongMaterial,
  Object3D,
  Box3,
  PointLight,
  Sphere,
  MeshStandardMaterial,
  MeshBasicMaterial,
  BufferAttribute,
  VertexColors,
  FrontSide,
  AdditiveBlending,
  Mesh,
  Vector3, AnimationMixer, Box3Helper, DoubleSide
} from "three";
import {BLOOM_LAYER} from "../../composer";
import Manager from './../resources';
import GlowShader from "../../composer/GlowShader";


class SceneObject extends Object3D {
  animations = [];
  mixer = null;
  isPlaying = false;
  animationSpeed = 1.0;
  animationOffset = 0.0;
  light = null;
  
  material = new MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.2,
    metalness: 1.0,
    //emissive: 0x000011,
    side: DoubleSide,
    transparent: true,
    envMap: Manager.get().env['default']
  });
  
  constructor(model = null, mixer = null) {
    super();
    this.frustumCulled = true;
    this.mixer = (model && model.mixer) ? model.mixer : (mixer || new AnimationMixer(this));
    
    this.modelOrigin = model;
    this.model = this.modelOrigin;
  }
  
  play(index = 0) {
    if (!this.isPlaying) {
      let clip = this.mixer.clipAction(this.animations[index], this.children[0]);
      
      clip.timeScale = this.animationSpeed;
      clip.time = this.animationOffset;
      
      clip.play();
    }
  
    this.isPlaying = true;
  }
  
  stop(index) {
    if (this.isPlaying) {
      this.mixer.clipAction(this.animations[index]).stop();
    }
  
    this.isPlaying = false;
  }
  
  updateMixer(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
  
  set model(target) {
    while (this.children.length) {
      let child = this.children[0];
      this.remove(child);

      child.dispose();
    }
    
    if (target) {
      let destModel = target.clone();
      destModel.traverse((targetModel) => {
        if (targetModel.isMesh) {
          targetModel.material = this.material;
  
          targetModel.material.onBeforeCompile = ((shader) => {
            shader.fragmentShader = Fragment;
            shader.vertexShader = Vertex;
          });
          
          targetModel.geometry.computeBoundingBox();
        }
      });
      
      if (target.animations) {
        this.animations = target.animations.map((clip) => clip.clone());
      }
  
      this.add(destModel);
    }
  }
  
  dispose() {
    this.model = null;
    super.dispose();
  }
  
  clone(recursive = true) {
    let clone;
    
    if (recursive) {
      clone = new SceneObject(this.modelOrigin, this.mixer);
    } else {
      clone = new SceneObject(null, this.mixer);
    }
  
    clone.position.copy(this.position);
    clone.rotation.copy(this.rotation);
    clone.scale.copy(this.scale);
    
    return clone;
  }
}

export default SceneObject;


const Vertex = `
#define STANDARD
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

varying vec3 fresnelPosition;
varying vec3 fresnelNormal;

void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
	
    vec4 viewPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 viewCameraPosition = projectionMatrix * modelMatrix * vec4(cameraPosition, 1.0);
    vec3 viewNormal = normalize(mat3( modelViewMatrix[0].xyz, modelViewMatrix[1].xyz, modelViewMatrix[2].xyz ) * normal);
    
    fresnelNormal = viewNormal;
    fresnelPosition = normalize(viewPosition.xyz);
}
`;

const Fragment = `
#define STANDARD
#ifdef PHYSICAL
	#define REFLECTIVITY
	#define CLEARCOAT
	#define TRANSPARENCY
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef TRANSPARENCY
	uniform float transparency;
#endif
#ifdef REFLECTIVITY
	uniform float reflectivity;
#endif
#ifdef CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheen;
#endif
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec3 fresnelPosition;
varying vec3 fresnelNormal;

void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#ifdef TRANSPARENCY
		diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );
	#endif
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
	
	vec3 viewDir = (viewMatrix * vec4(cameraPosition, 1.0)).xyz - fresnelPosition;
    float fresnel = 0.0 + 1.0 * pow(1.0 - saturate(dot(fresnelNormal, viewDir)), 4.0);
    
    gl_FragColor.rgb += vec3(0.0, 0.1, 1.0) * fresnel;
}
`;
