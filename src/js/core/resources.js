import path from 'path';
import {OBJLoader} from './../vendor/OBJLoader';
import placeholderFunc from './../utils/placeholderFunc';
import data from './../resources.json';
import {AnimationMixer, Box3, CubeTextureLoader, RepeatWrapping, TextureLoader, Vector3} from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";

const resources = {
  models: {},
  env: [],
  textures: {}
};

const getXHRProgress = (xhr) => {
  if ( xhr.lengthComputable ) {
    return xhr.loaded / xhr.total;
  }
  
  return 0;
};

const onModelLoad = (data) => {
  let model = data.scene || data;
  if (!model.traverse) {
    // Unknown type of result
    return data;
  }
  
  if (model.animations) {
    model.mixer = new AnimationMixer(model);
  }
  
  let offset = new Vector3();
  let box = new Box3().setFromObject(model);
  box.getCenter(offset);
  
  model.position.sub(offset);
  model.position.y = 1;
  
  return model;
}

class Manager {
  static load(staticPath = './static', onProgressCallback) {
    const modelsEntries = Object.entries(data.models);
    const envEntries = Object.entries(data.env);
    const texturesEntries = Object.entries(data.textures);
    
    const total = modelsEntries.length + envEntries.length + texturesEntries.length;
    
    const currentDir = location.pathname.match(/\.html$/) ? path.dirname(location.pathname) : location.pathname;
    
    const font = new FontFace('LabelRoboto', `url(${path.resolve(currentDir, staticPath, './Roboto.woff2')})`);
    
    return Promise.all([
        Manager.loadModels(path.resolve(currentDir, staticPath), onProgressCallback, modelsEntries, total),
        Manager.loadEnv(path.resolve(currentDir, staticPath), onProgressCallback, envEntries, total),
        Manager.loadTexture(path.resolve(currentDir, staticPath), onProgressCallback, texturesEntries, total),
        font.load().then((loadedFace) => {document.fonts.add(loadedFace)})
    ]);
  }
  
  static loadTexture(staticPath, onProgressCallback, images, total) {
    return new Promise((resolve, reject) => {
      let onProgress = onProgressCallback || placeholderFunc;
      
      let loaded = 0;
      
      const onImgLoad = (obj, index, callback) => {
        loaded++;
        onProgress(loaded / total);
        
        obj.wrapS = obj.wrapT = RepeatWrapping;
        
        resources.textures[index] = obj;
        callback();
      };
      
      const onImgProgress = (value) => {
        onProgress((loaded + value) / total);
      };
      
      const loader = new TextureLoader();
      
      let promises = images.map(([k, v]) => {
        return new Promise((onLoad, onError) => {
          loader
          .load(
              path.resolve(staticPath, v),
              (img) => onImgLoad(img, k, onLoad),
              placeholderFunc,
              onError
          );
        });
      });
      
      Promise.all(promises).then(resolve).catch(reject);
    });
  }
  
  static loadEnv(staticPath, onProgressCallback, images, total) {
    return new Promise((resolve, reject) => {
      let onProgress = onProgressCallback || placeholderFunc;
      
      let loaded = 0;
      
      const onImgLoad = (obj, index, callback) => {
        loaded++;
        onProgress(loaded / total);
        resources.env[index] = obj;
        callback();
      };
  
      const onImgProgress = (value) => {
        onProgress((loaded + value) / total);
      };
      
      const loader = new CubeTextureLoader();
      
      let promises = images.map(([k, v]) => {
        return new Promise((onLoad, onError) => {
         loader
          .load(
              v.map((t) => path.resolve(staticPath, t)),
              (img) => onImgLoad(img, k, onLoad),
              placeholderFunc,
              onError
          );
        });
      });
      
      Promise.all(promises).then(resolve).catch(reject);
    });
  }
  
  static loadModels(staticPath, onProgressCallback, models, total) {
    return new Promise((resolve, reject) => {
      let onProgress = onProgressCallback || placeholderFunc;
      
      let loaded = 0;
      
      const objLoader = new OBJLoader();
      const fbxLoader = new FBXLoader();
  
      const onObjLoad = (obj, id, callback) => {
        loaded++;
        onProgress(loaded / total);
        onModelLoad(obj);
        resources.models[id] = obj;
        callback();
      };
  
      const onObjProgress = (value) => {
        onProgress((loaded + value) / total);
      };
      
      let promises = models.map(([k, v]) => {
        return new Promise((onLoad, onError) => {
          let targetLoader = v.match(/\.fbx$/i) ? fbxLoader : objLoader;
          targetLoader.load(
              path.resolve(staticPath, v),
              (obj) => onObjLoad(obj, k, onLoad),
              placeholderFunc,
              onError
          );
        });
      });
      
      Promise.all(promises).then(resolve).catch(reject);
    });
  }
  
  static get() {
    return resources;
  }
}

export default Manager;
