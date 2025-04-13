import { THdriResults, TImageResults, TSpecification } from '@/types';

self.onmessage = async e => {
  const { models, images, spec, environment, hdri } = e.data;

  const modelResults: Record<string, ArrayBuffer> = {};
  const imageResults: Record<string, TImageResults> = {};
  const hdriResults: Record<string, THdriResults> = {};
  const environmentResults: Record<string, ArrayBuffer> = {};
  const specResults: Record<string, TSpecification> = {};

  for (const model of models) {
    try {
      const res = await fetch(model.url as string);
      const arrayBuffer = await res.arrayBuffer();
      modelResults[model.name] = arrayBuffer;
    } catch (err) {
      console.error(`Failed to load model: ${model.name}`, err);
    }
  }

  for (const hdriFile of hdri) {
    try {
      const res = await fetch(hdriFile.url as string);
      // Check the extension of the hdri
      const ext = hdriFile.url.split('.').pop();
      const arrayBuffer = await res.arrayBuffer();
      hdriResults[hdriFile.name] = { type: ext, buffer: arrayBuffer };
    } catch (err) {
      console.error(`Failed to load HDRI: ${hdriFile.name}`, err);
    }
  }

  for (const image of images) {
    try {
      const res = await fetch(image.url as string);
      // Check the extension of the image
      const ext = image.url.split('.').pop();
      const arrayBuffer = await res.arrayBuffer();
      imageResults[image.name] = { type: ext, buffer: arrayBuffer };
    } catch (err) {
      console.error(`Failed to load image: ${image.name}`, err);
    }
  }

  for (const env of environment) {
    try {
      const res = await fetch(env.url as string);
      const arrayBuffer = await res.arrayBuffer();
      environmentResults[env.name] = arrayBuffer;
    } catch (err) {
      console.error(`Failed to load environment: ${env.name}`, err);
    }
  }

  for (const jsonFile of spec) {
    try {
      const res = await fetch(jsonFile.url as string);
      const json = await res.json();
      specResults[jsonFile.name] = json;
    } catch (err) {
      console.error(`Failed to load JSON: ${jsonFile.name}`, err);
    }
  }

  postMessage({
    models: modelResults,
    images: imageResults,
    environment: environmentResults,
    hdri: hdriResults,
    spec: specResults
  });
};




