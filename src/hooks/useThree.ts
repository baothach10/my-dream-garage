import { useEffect, useRef, useState } from 'react';
import Stats from 'stats.js';
import * as THREE from 'three';
import { CSS2DRenderer, PointerLockControls } from 'three/examples/jsm/Addons';
import { degToRad } from 'three/src/math/MathUtils';

import { useAssets } from '@/context/AssetLoaderContext';

if (typeof window !== 'undefined') {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  const animate = () => {
    stats?.update();
    requestAnimationFrame(animate);
  };

  animate();
}

export function useThree() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    webglScene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    light: THREE.DirectionalLight;
    webglRenderer: THREE.WebGLRenderer;
    cssRenderer: CSS2DRenderer;
    cssScene: THREE.Scene;
    controls: PointerLockControls;
    initialCameraPosition: THREE.Vector3;
    isMounted: boolean;
  } | null>(null);
  let now: number = 0;
  let then: number = 0;
  let elapsed: number = 0;

  const [isFreelyViewing, setIsFreelyViewing] = useState(1);
  const { animationMixers } = useAssets();
  const [isMounted, setIsMounted] = useState(false);

  const updateAnimationMixers = (delta: number) => {
    if (!animationMixers) return;
    // console.log(animationMixers);
    Object.values(animationMixers).forEach(mixer => {
      mixer.update(delta);
    });
  };

  // const [initialCameraPosition, setInitialCameraPosition] = useState<Vector3 | undefined>();

  // const updateCSSObjects = (cssScene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  //   cssScene.traverse((child) => {
  //     if (child instanceof CSS3DObject) {
  //       // child.quaternion.copy(camera.quaternion);
  //     }
  //   });
  // }

  useEffect(() => {
    if (!state) return;
    state.controls.pointerSpeed = isFreelyViewing;
  }, [isFreelyViewing, state]);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('three hook');

    // Scene Setup
    const webglScene = new THREE.Scene();
    const cssScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 1.5, 0);

    const webglRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    webglRenderer.setPixelRatio(window.devicePixelRatio);
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    webglRenderer.setSize(window.innerWidth, window.innerHeight);
    const webglDiv = document.createElement('div');
    webglDiv.id = 'webgl';
    webglDiv.appendChild(webglRenderer.domElement);
    mountRef.current.appendChild(webglDiv);

    // CSS3D Renderer (for HTML elements)
    const cssRenderer = new CSS2DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.classList.add('css2d-renderer');
    // cssRenderer.domElement.style.pointerEvents = "none";
    // cssRenderer.domElement.style.userSelect = "none";

    const css3dDiv = document.createElement('div');
    css3dDiv.id = 'css';
    css3dDiv.appendChild(cssRenderer.domElement);
    mountRef.current.appendChild(css3dDiv);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 0);
    light.position.set(2, 2, 5);
    webglScene.add(light);

    // Controls
    const controls = new PointerLockControls(camera, webglRenderer.domElement);

    controls.pointerSpeed = 1;
    controls.minPolarAngle = degToRad(1);
    controls.maxPolarAngle = degToRad(179);

    // Resize window
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      webglRenderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    setIsMounted(true);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      now = Date.now();
      elapsed = now - then;
      const fpsInterval = 1000 / 144; // 60 fps
      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        const delta = clock.getDelta();
        updateAnimationMixers(delta);
        // controls.update(delta);
        // updateCSSObjects(cssScene, camera);

        // webglScene.updateMatrixWorld(true);

        webglRenderer.render(webglScene, camera);
        cssRenderer.render(cssScene, camera);
      }

      requestAnimationFrame(animate);
    };
    animate();

    setState({
      webglScene,
      camera,
      light,
      webglRenderer,
      cssRenderer,
      controls,
      initialCameraPosition: camera.position.clone(),
      cssScene,
      isMounted
    });
    // Cleanup
    return () => {
      mountRef.current?.removeChild(webglRenderer.domElement);
      mountRef.current?.removeChild(cssRenderer.domElement);
      webglRenderer.dispose();
    };
  }, []);

  return { ...state, mountRef, isFreelyViewing, setIsFreelyViewing };
}
