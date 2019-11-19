import path from 'path';
import {OBJLoader} from './../vendor/OBJLoader';
import placeholderFunc from './../utils/placeholderFunc';
import data from './../resources.json';
import {CubeTextureLoader} from "three";

const resources = {
  models: {},
  env: []
};

const getXHRProgress = (xhr) => {
  if ( xhr.lengthComputable ) {
    return xhr.loaded / xhr.total;
  }
  
  return 0;
};

class Manager {
  static load(staticPath = './static', onProgressCallback) {
    const modelsEntries = Object.entries(data.models);
    const envEntries = Object.entries(data.env);
    
    const total = modelsEntries.length + envEntries.length;
    
    const currentDir = location.pathname.match(/\.html$/) ? path.dirname(location.pathname) : location.pathname;
    
    return Promise.all([
        Manager.loadModels(path.resolve(currentDir, staticPath), onProgressCallback, modelsEntries, total),
        Manager.loadEnv(path.resolve(currentDir, staticPath), onProgressCallback, envEntries, total),
    ]);
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
              (xhr) => onImgProgress(getXHRProgress(xhr)),
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
      
      const loader = new OBJLoader();
  
      const onObjLoad = (obj, id, callback) => {
        loaded++;
        onProgress(loaded / total);
        resources.models[id] = obj;
        callback();
      };
  
      const onObjProgress = (value) => {
        onProgress((loaded + value) / total);
      };
      
      let promises = models.map(([k, v]) => {
        return new Promise((onLoad, onError) => {
          loader.load(
              path.resolve(staticPath, v),
              (obj) => onObjLoad(obj, k, onLoad),
              (xhr) => onObjProgress(getXHRProgress(xhr)),
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
