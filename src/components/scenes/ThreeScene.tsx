import React, { useEffect, useRef, useState } from 'react';
import { AnimationAction, BoxGeometry, EquirectangularReflectionMapping, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Scene, SkinnedMesh, Vector3, WebGLRenderer } from 'three';
import { CSS2DObject, GLTF } from 'three/examples/jsm/Addons';
import { degToRad } from 'three/src/math/MathUtils';

import { carNames, carCoordinates } from '@/constants';
import { useThree } from '@/hooks/useThree';
import { ILabelPosition, ILerpCoordinates, IThreeScene } from '@/types';
import './ThreeScene.css';
import { getCarCenter, getCarHood, getCarLeftSide, getCarRightSide, getCarTail, lockMouseControl } from '@/utils';


const lerpCoordinates: ILerpCoordinates[] = [];
const labelCoordinates: ILabelPosition[][] = [];

export const ThreeScene: React.FC<IThreeScene> = ({ models, textures, specs, animationActions, animationMixers }: IThreeScene) => {
    const {
        webglScene,
        camera,
        webglRenderer,
        mountRef,
        controls,
        initialCameraPosition,
        cssRenderer,
        cssScene,
        isMounted,
        setIsFreelyViewing
    } = useThree();
    const [isRenderedShadow, setIsRenderedShadow] = useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    const labelObjects = useRef<CSS2DObject[]>([]);

    const playAnimationOnce = (animAction: AnimationAction) => {
        if (animAction.isRunning()) return;
        const animTime = animAction.getClip().duration;
        if (animAction.paused) animAction.paused = false;
        animAction.timeScale = 1;
        animAction.play();
        setTimeout(
            () => {
                animAction.paused = true;
            },
            Math.floor(animTime * 900)
        );
    };

    const playAnimationReverse = (animAction: AnimationAction) => {
        if (animAction.isRunning()) return;
        const animTime = animAction.getClip().duration;
        if (animAction.paused) animAction.paused = false;
        animAction.timeScale = -1; // Play in reverse
        animAction.play();
        setTimeout(
            () => {
                animAction.stop();
            },
            Math.floor(animTime * 900)
        );
    };

    const create2DCSSElement = (
        content: string | string[],
        position: Vector3,
        className?: string
    ) => {
        if (!cssScene) return;

        const div = document.createElement('div');
        div.className = `${className} css-label`;
        if (Array.isArray(content)) {
            content.forEach(text => {
                const span = document.createElement('span');
                span.textContent = text;
                span.style.display = 'block';
                div.appendChild(span);
            });
        } else {
            div.textContent = content;
        }
        div.style.color = 'white';
        div.style.fontSize = '12px';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        div.style.padding = '2px 5px';
        div.style.borderRadius = '3px';
        // div.style.zIndex = '1';
        div.style.opacity = '0';

        const label = new CSS2DObject(div);
        label.position.copy(position);

        labelObjects.current.push(label); // Store the label object in the ref
        cssScene.add(label);
        return label;
    };

    const initializeCarsLayout = (
        webglScene: Scene,
        cssScene: Scene,
        models: { [key: string]: GLTF }
    ) => {
        carNames.forEach((carName, index) => {
            const carModel = models[carName]!;
            carModel.scene.traverse(child => {
                if (child instanceof Mesh || child instanceof SkinnedMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // (child.material as MeshStandardMaterial).color.set(0xffffff); // Set the color to white
                    (child.material as MeshStandardMaterial).opacity = 1;
                }
            });

            const carCoor = carCoordinates[index]!;
            carModel.scene.scale.set(2.25, 2.25, 2.25); // Adjust scale for layout
            carModel.scene.position.set(carCoor.x, carCoor.y, carCoor.z);

            const carHood = getCarHood(carModel, degToRad(carCoor.rotation));

            const carTail = getCarTail(carModel, degToRad(carCoor.rotation));
            const carRightSide = getCarRightSide(carModel, degToRad(carCoor.rotation));
            const carLeftSide = getCarLeftSide(carModel, degToRad(carCoor.rotation));

            carModel.scene.rotation.y = degToRad(carCoor.rotation); // Adjust rotation for layout

            webglScene.add(carModel.scene as unknown as Scene);

            // const cubeGeometry = new BoxGeometry(0.1, 0.1, 0.1);

            // const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            // const cubeMaterial = new MeshStandardMaterial({ color: randomColor });
            // const cube = new Mesh(cubeGeometry, cubeMaterial);
            // cube.name = 'carHood';
            // cube.position.copy(carHood);

            // const cube1 = new Mesh(cubeGeometry, cubeMaterial);
            // cube1.name = 'carTail';
            // cube1.position.copy(carTail);

            // const cube2 = new Mesh(cubeGeometry, cubeMaterial);
            // cube2.name = 'carRightSide';
            // cube2.position.copy(carRightSide);w

            // const cube3 = new Mesh(cubeGeometry, cubeMaterial);
            // cube3.name = 'carLeftSide';
            // cube3.position.copy(carLeftSide);

            const frontLightLabel = carModel.scene.getObjectByName('Light');
            const logoLabel = carModel.scene.getObjectByName('Logo');
            const hoodLabel = carModel.scene.getObjectByName('Hood');
            const doorLabel = carModel.scene.getObjectByName('Door');
            const wheelLabel = carModel.scene.getObjectByName('Wheel');
            const fuelCapLabel = carModel.scene.getObjectByName('FuelCap');
            const backLightLabel = carModel.scene.getObjectByName('BackLight');
            const transmissionLabel = carModel.scene.getObjectByName('Transmission');
            const engineLabel = carModel.scene.getObjectByName('Engine');

            if (!specs[carName]) return;
            // add coordinates of different parts positions of car hood
            if (frontLightLabel && logoLabel && hoodLabel) {
                labelCoordinates.push([
                    {
                        x: frontLightLabel.getWorldPosition(new Vector3()).x,
                        y: frontLightLabel.getWorldPosition(new Vector3()).y,
                        z: frontLightLabel.getWorldPosition(new Vector3()).z,
                        content: specs[carName].topSpeed
                    },
                    {
                        x: logoLabel.getWorldPosition(new Vector3()).x,
                        y: logoLabel.getWorldPosition(new Vector3()).y,
                        z: logoLabel.getWorldPosition(new Vector3()).z,
                        content: specs[carName].price
                    },
                    {
                        x: hoodLabel.getWorldPosition(new Vector3()).x,
                        y: hoodLabel.getWorldPosition(new Vector3()).y,
                        z: hoodLabel.getWorldPosition(new Vector3()).z,
                        content: specs[carName].name + ` (${specs[carName].year})`
                    }
                ]);
            }

            // add coordinates of different parts positions of car side

            if (doorLabel && wheelLabel && transmissionLabel) {
                labelCoordinates.push([
                    {
                        x: doorLabel.getWorldPosition(new Vector3()).x,
                        y: doorLabel.getWorldPosition(new Vector3()).y,
                        z: doorLabel.getWorldPosition(new Vector3()).z,
                        content:
                            carName === 'mercedesG63Amg'
                                ? [specs[carName].engine, `${specs[carName].horsepower} HP`]
                                : `${specs[carName].horsepower} HP`
                    },
                    {
                        x: wheelLabel.getWorldPosition(new Vector3()).x,
                        y: wheelLabel.getWorldPosition(new Vector3()).y,
                        z: wheelLabel.getWorldPosition(new Vector3()).z,
                        content: specs[carName].acceleration
                    },
                    {
                        x: transmissionLabel.getWorldPosition(new Vector3()).x,
                        y: transmissionLabel.getWorldPosition(new Vector3()).y,
                        z: transmissionLabel.getWorldPosition(new Vector3()).z,
                        content: specs[carName].transmission
                    }
                ]);
            }

            // add coordinates of different parts positions of car tail

            if (backLightLabel && fuelCapLabel) {
                if (engineLabel) {
                    labelCoordinates.push([
                        {
                            x: backLightLabel.getWorldPosition(new Vector3()).x,
                            y: backLightLabel.getWorldPosition(new Vector3()).y,
                            z: backLightLabel.getWorldPosition(new Vector3()).z,
                            content: specs[carName].features
                        },
                        {
                            x: fuelCapLabel.getWorldPosition(new Vector3()).x,
                            y: fuelCapLabel.getWorldPosition(new Vector3()).y,
                            z: fuelCapLabel.getWorldPosition(new Vector3()).z,
                            content: specs[carName].fuelType
                        },
                        {
                            x: engineLabel.getWorldPosition(new Vector3()).x,
                            y: engineLabel.getWorldPosition(new Vector3()).y,
                            z: engineLabel.getWorldPosition(new Vector3()).z,
                            content: specs[carName].engine
                        }
                    ]);
                } else {
                    labelCoordinates.push([
                        {
                            x: backLightLabel.getWorldPosition(new Vector3()).x,
                            y: backLightLabel.getWorldPosition(new Vector3()).y,
                            z: backLightLabel.getWorldPosition(new Vector3()).z,
                            content: specs[carName].features
                        },
                        {
                            x: fuelCapLabel.getWorldPosition(new Vector3()).x,
                            y: fuelCapLabel.getWorldPosition(new Vector3()).y,
                            z: fuelCapLabel.getWorldPosition(new Vector3()).z,
                            content: specs[carName].fuelType
                        }
                    ]);
                }
            }

            lerpCoordinates.push(
                {
                    x: carHood.x,
                    y: carHood.y,
                    z: carHood.z,
                    index,
                    deltaX: index < 2 ? -1.5 : index < 4 ? 1.5 : 0,
                    deltaY: 0.5,
                    deltaZ: index < 2 ? 1.5 : index < 4 ? 1.5 : 2
                },
                {
                    x: carRightSide.x,
                    y: carRightSide.y,
                    z: carRightSide.z,
                    index,
                    deltaX: index < 2 ? 2.25 : index < 4 ? 2.5 : 3,
                    deltaY: 0.25,
                    deltaZ: index < 2 ? 2.25 : index < 4 ? -2.5 : 0
                },
                {
                    x: carTail.x,
                    y: carTail.y,
                    z: carTail.z,
                    index,
                    deltaX: index < 2 ? 1 : index < 4 ? -1 : 0,
                    deltaY: 0.5,
                    deltaZ: index < 2 ? -2.5 : index < 4 ? -2.5 : -2
                }
            );

            // webglScene.add(cube);
            // webglScene.add(cube1);
            // webglScene.add(cube2);
            // webglScene.add(cube3);

            carModel.scene.traverse(child => {
                if (child instanceof SkinnedMesh || child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    (child.material as MeshStandardMaterial).depthWrite = true;
                    (child.material as MeshStandardMaterial).depthTest = true;
                    (child.material as MeshStandardMaterial).alphaTest = 0.7;
                }
            });

            // if (index === 0) {
            //   if (!hoodLabel || !logoLabel || !frontLightLabel) return;

            //   create2DCSSElement('Car Hood', hoodLabel.getWorldPosition(new Vector3()));
            //   create2DCSSElement('Car Hood', logoLabel.getWorldPosition(new Vector3()));
            //   create2DCSSElement('Car Hood', frontLightLabel.getWorldPosition(new Vector3()));
            // }

            if (index === carNames.length - 1) {
                const carCenter = getCarCenter(carModel, degToRad(carCoor.rotation));
                // const cube4 = new Mesh(cubeGeometry, cubeMaterial);
                // cube4.name = 'carCenter';
                // cube4.position.copy(carCenter);
                // webglScene.add(cube4);
                lerpCoordinates.push({
                    x: carCenter.x + 0.5,
                    y: carCenter.y + 0.5,
                    z: carCenter.z - 0.25,
                    index,
                    deltaX: 0,
                    deltaY: 0,
                    deltaZ: 0
                });
            }
        });
    }

    // ONLY FOR DEBUG
    // useEffect(() => {
    //   if (!scene || !camera || !webglRenderer || !isLoaded || !controls) return;

    //   enableDebugMode(camera, webglRenderer.domElement.ownerDocument);
    // }, [scene, camera, webglRenderer, isLoaded]);


    useEffect(() => {
        if (
            !webglScene ||
            !camera ||
            !webglRenderer ||
            !controls ||
            !cssRenderer ||
            !cssScene
        )
            return;

        // Test
        // init(webglScene, cssScene, webglRenderer, cssRenderer);

        const warehouseTexture = textures['warehouseHDRI'];

        console.log(warehouseTexture)

        if (warehouseTexture) {
            const pmremGenerator = new PMREMGenerator(webglRenderer);
            // pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(warehouseTexture);
            console.log(envMap)
            warehouseTexture.mapping = EquirectangularReflectionMapping;
            webglScene.environment = warehouseTexture;
            // pmremGenerator.dispose();
        }

        models['warehouse']!.scene.traverse(child => {
            if (child instanceof Mesh || child instanceof SkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        webglScene.add(models['warehouse']!.scene);

        if (!isRenderedShadow) {
            // console.log(Object.keys(specs))
            initializeCarsLayout(webglScene, cssScene, models);
            setIsRenderedShadow(true);
        }

        window.addEventListener('click', () => {
            lockMouseControl(controls);
        });

        return () => {
            // Cleanup event listeners
            window.removeEventListener('click', () => {
                lockMouseControl(controls);
            });
        };
    }, [isMounted]);


    return <div ref={mountRef} className='three-scene-wrapper' />
};

export default ThreeScene;