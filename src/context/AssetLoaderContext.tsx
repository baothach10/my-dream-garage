import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnimationAction, AnimationMixer, DataTexture, EquirectangularReflectionMapping, LoadingManager, Texture, TextureLoader } from 'three';
import { DRACOLoader, EXRLoader, RGBELoader } from 'three/examples/jsm/Addons';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { THdriResults, TImageResults, TSpecification } from '@/types';
import { convertImageBufferToBlobUrl } from '@/utils';
import LoadResourcesWorker from '@/workers/loadResources.worker?worker&ts';

interface IAssetContextProps {
  isLoaded: boolean;
  progress: number;
  textures: { [key: string]: Texture };
  models: { [key: string]: GLTF };
  specs: { [key: string]: TSpecification };
  envBackground: Texture | undefined;
  animationActions: { [key: string]: AnimationAction };
  animationMixers: { [key: string]: AnimationMixer };
}

const AssetLoaderContext = createContext<IAssetContextProps | null>(null);

export function AssetLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textures, setTextures] = useState<{ [key: string]: Texture }>({});
  const [envBackground, setEnvBackground] = useState<Texture>();
  const [models, setModels] = useState<{ [key: string]: GLTF }>({});
  const [specs, setSpecs] = useState<{ [key: string]: TSpecification }>({});
  const [animationActions, setAnimationActions] = useState<{
    [key: string]: AnimationAction;
  }>({});
  const [animationMixers, setAnimationMixers] = useState<{
    [key: string]: AnimationMixer;
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
          const parsedImages: Record<string, Texture | null> = {};

          const rawHDRI = e.data.hdri as Record<string, THdriResults>;
          const parsedHDRI: Record<string, Texture | null> = {};

          const rawEnvironment = e.data.environment as Record<string, ArrayBuffer>;
          // const parsedEnvironment: Record<string, Texture | null> = {};

          const rawSpec = e.data.spec as { showroom: Record<string, TSpecification> };
          const parsedSpec: Record<string, TSpecification | null> = {};

          const manager = new LoadingManager();
          const gltfLoader = new GLTFLoader(manager);
          const dracoLoader = new DRACOLoader(manager);
          const textureLoader = new TextureLoader(manager);
          const hdrLoader = new RGBELoader(manager);
          const exrLoader = new EXRLoader(manager);
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
          gltfLoader.setDRACOLoader(dracoLoader);

          let parsedResourcesCount = 0;

          const totalResourcesCount = Object.keys(rawModels).length + Object.keys(rawImages).length + Object.keys(rawHDRI).length + Object.keys(rawEnvironment).length + Object.keys(rawSpec).length;

          const updateProgress = (parsedModelsCount: number, totalRawModels: number) => {
            setProgress(Math.round((parsedModelsCount / totalRawModels) * 100));
          };


          const loadHDRI = (url: string, type: string) => {
            return new Promise<Texture | DataTexture>((resolve, reject) => {
              const loader = type === 'hdr' ? hdrLoader : exrLoader;
              loader.load(
                url,
                (texture) => {
                  texture.mapping = EquirectangularReflectionMapping;
                  resolve(texture);
                },
                undefined,
                reject
              );
            });
          };

          // Model Loading Logic
          const loadModel = async (name: string, buffer: ArrayBuffer) => {
            try {
              const gltf = await new Promise<GLTF>((resolve, reject) => {
                gltfLoader.parse(buffer, '', resolve, reject);
              });
              parsedModels[name] = gltf;
              parsedResourcesCount += 1;
              updateProgress(parsedResourcesCount, totalResourcesCount);
            } catch (err) {
              console.error(`Failed to parse ${name}:`, err);
              parsedModels[name] = null;
              parsedResourcesCount += 1;
              updateProgress(parsedResourcesCount, totalResourcesCount);
            }
          };

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

          // Create Promises for Models and HDRI
          const modelLoadPromises = Object.entries(rawModels).map(([name, buffer]) => {
            return loadModel(name, buffer);
          });

          const hdrLoadPromises = Object.entries(rawHDRI).map(([name, data]) => {
            if (data) {
              const { type, buffer } = data;
              const url = convertImageBufferToBlobUrl(buffer, 'application/octet-stream');
              return loadHDRI(url, type)
                .then(texture => {
                  parsedHDRI[name] = texture;
                })
                .catch(err => {
                  console.error(`Failed to load HDRI ${name}:`, err);
                });
            }
          });

          // load car specifications
          for (const name in rawSpec['showroom']) {
            if (name && rawSpec.showroom[name]) {
              try {
                parsedSpec[name] = rawSpec.showroom[name];
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

          // Wait for both models and HDRIs to finish loading
          await Promise.all([...modelLoadPromises, ...hdrLoadPromises]);

          const animationMixersObj: { [key: string]: AnimationMixer } = {};
          const animationActionsObj: { [key: string]: AnimationAction } = {};

          // Load the animations
          for (const [modelName, model] of Object.entries(parsedModels)) {
            if (model) {
              const mixer = new AnimationMixer(model.scene);
              model.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                animationActionsObj[modelName] = action;
                animationMixersObj[modelName] = mixer;
              });
            }
          }

          // Set the state with the loaded resources
          setModels(parsedModels as { [key: string]: GLTF });
          setTextures({ ...parsedImages as { [key: string]: Texture }, ...parsedHDRI as { [key: string]: Texture | DataTexture } });
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
