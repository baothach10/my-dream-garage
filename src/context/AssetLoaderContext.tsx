import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as THREE from 'three';
import { DRACOLoader, EXRLoader, RGBELoader } from 'three/examples/jsm/Addons';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { THdriResults, TImageResults, TSpecification } from '@/types';
import { convertImageBufferToBlobUrl } from '@/utils';
import LoadResourcesWorker from '@/workers/loadResources.worker?worker&ts';

interface IAssetContextProps {
  isLoaded: boolean;
  progress: number;
  textures: { [key: string]: THREE.Texture };
  models: { [key: string]: GLTF };
  specs: { [key: string]: TSpecification };
  envBackground: THREE.Texture | undefined;
  animationActions: { [key: string]: THREE.AnimationAction };
  animationMixers: { [key: string]: THREE.AnimationMixer };
}

const AssetLoaderContext = createContext<IAssetContextProps | null>(null);

export function AssetLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textures, setTextures] = useState<{ [key: string]: THREE.Texture }>({});
  const [envBackground, setEnvBackground] = useState<THREE.Texture>();
  const [models, setModels] = useState<{ [key: string]: GLTF }>({});
  const [specs, setSpecs] = useState<{ [key: string]: TSpecification }>({});
  const [animationActions, setAnimationActions] = useState<{
    [key: string]: THREE.AnimationAction;
  }>({});
  const [animationMixers, setAnimationMixers] = useState<{
    [key: string]: THREE.AnimationMixer;
  }>({});


  useEffect(() => {
    console.log('rerender')
    function preload() {
      try {
        const worker = new LoadResourcesWorker();
        worker.onmessage = async (e) => {
          console.log('Worker loaded Raw Data');

          const rawModels = e.data.models as Record<string, ArrayBuffer>;
          const parsedModels: Record<string, GLTF | null> = {};

          const rawImages = e.data.images as Record<string, TImageResults>;
          const parsedImages: Record<string, THREE.Texture | null> = {};

          const rawHDRI = e.data.hdri as Record<string, THdriResults>;
          const parsedHDRI: Record<string, THREE.Texture | null> = {};

          const rawEnvironment = e.data.environment as Record<string, ArrayBuffer>;
          // const parsedEnvironment: Record<string, THREE.Texture | null> = {};

          const rawSpec = e.data.spec as Record<string, TSpecification>;
          const parsedSpec: Record<string, TSpecification | null> = {};

          const manager = new THREE.LoadingManager();
          const gltfLoader = new GLTFLoader(manager);
          const dracoLoader = new DRACOLoader(manager);
          const textureLoader = new THREE.TextureLoader(manager);
          const hdrLoader = new RGBELoader(manager);
          const exrLoader = new EXRLoader(manager);
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
          gltfLoader.setDRACOLoader(dracoLoader);

          let parsedResourcesCount = 0;

          const totalResourcesCount = Object.keys(rawModels).length + Object.keys(rawImages).length + Object.keys(rawHDRI).length + Object.keys(rawEnvironment).length + Object.keys(rawSpec).length;

          const updateProgress = (parsedModelsCount: number, totalRawModels: number) => {
            setProgress(Math.round((parsedModelsCount / totalRawModels) * 100));
          };


          for (const [name, buffer] of Object.entries(rawModels)) {
            if (buffer) {
              try {
                const gltf = await new Promise<GLTF>((resolve, reject) =>
                  gltfLoader.parse(buffer, '', resolve, reject)
                );
                parsedModels[name] = gltf;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              } catch (err) {
                console.error(`Failed to parse ${name}:`, err);
                parsedModels[name] = null;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              }
            }
          }

          for (const [name, data] of Object.entries(rawImages)) {
            if (data) {
              const { type, buffer } = data;
              try {
                const url = convertImageBufferToBlobUrl(buffer, type);
                const texture = textureLoader.load(url, () => {
                  URL.revokeObjectURL(url);
                });
                parsedImages[name] = texture;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              } catch (err) {
                console.error(`Failed to parse ${name}:`, err);
                parsedImages[name] = null;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              }
            }
          }

          for (const [name, data] of Object.entries(rawHDRI)) {
            if (data) {
              const { type, buffer } = data;
              try {
                const url = convertImageBufferToBlobUrl(buffer, type);
                const texture = type === 'hdr' ? hdrLoader.load(url) : exrLoader.load(url);
                parsedHDRI[name] = texture;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              } catch (err) {
                console.error(`Failed to parse ${name}:`, err);
                parsedHDRI[name] = null;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              }
            }
          }

          for (const [name, spec] of Object.entries(rawSpec)) {
            if (spec) {
              try {
                parsedSpec[name] = spec;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              } catch (err) {
                console.error(`Failed to parse ${name}:`, err);
                parsedSpec[name] = null;
                parsedResourcesCount += 1;
                updateProgress(parsedResourcesCount, totalResourcesCount);
              }
            }
          }

          const animationMixersObj: { [key: string]: THREE.AnimationMixer } = {};
          const animationActionsObj: { [key: string]: THREE.AnimationAction } = {};

          // Load the animations
          for (const [modelName, model] of Object.entries(parsedModels)) {
            if (model) {
              const mixer = new THREE.AnimationMixer(model.scene);
              model.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                animationActionsObj[modelName] = action;
                animationMixersObj[modelName] = mixer;
              });
            }
          }

          // Set the state with the loaded resources
          setModels(parsedModels as { [key: string]: GLTF });
          setTextures({ ...parsedImages as { [key: string]: THREE.Texture }, ...parsedHDRI as { [key: string]: THREE.Texture } });
          setAnimationActions(animationActionsObj);
          setAnimationMixers(animationMixersObj);
          setSpecs(parsedSpec as { [key: string]: TSpecification });
          setIsLoaded(true);
        }

        worker.postMessage({
          models: [
            { name: 'lamborghiniRevuelto', url: '/assets/models/lamborghiniRevuelto.glb' },
            { name: 'bugattiTourbillon', url: '/assets/models/bugattiTourbillon.glb' },
            { name: 'lamborghiniCentenario', url: '/assets/models/lamborghiniCentenario.glb' },
            { name: 'koenigseggOnePro', url: '/assets/models/koenigseggOnePro.glb' },
            { name: 'mercedesG63Amg', url: '/assets/models/mercedesG63Amg.glb' },
            { name: 'warehouse', url: '/assets/models/warehouse.glb' },
          ],
          hdri: [
            { name: 'warehouseHDRI', url: '/assets/images/warehouse.hdr' },
          ],
          environment: [

          ],
          spec: [
            { name: 'showroom', url: '/assets/data/showroom.json' },
          ],
          images: []
        });
        console.log('Worker started');
      } catch (e) {
        console.error('Preload error:', e)
      }
    }


    if (!isLoaded)
      void preload()
  }, [])

  return (
    <AssetLoaderContext.Provider
      value={{
        isLoaded,
        progress,
        textures,
        models,
        envBackground,
        animationActions,
        animationMixers,
        specs
      }}
    >
      {children}
    </AssetLoaderContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetLoaderContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetLoaderProvider');
  }
  return context;
}
