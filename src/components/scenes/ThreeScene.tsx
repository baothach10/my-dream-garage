import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimationAction, EquirectangularReflectionMapping, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, SkinnedMesh, Vector3 } from 'three';
import { CSS2DObject, GLTF } from 'three/examples/jsm/Addons';
import { degToRad } from 'three/src/math/MathUtils';

import { carNames, carCoordinates } from '@/constants';
import { useThree } from '@/hooks/useThree';
import { ILabelPosition, ILerpCoordinates, IThreeScene } from '@/types';
import './ThreeScene.css';
import { getCarCenter, getCarHood, getCarRightSide, getCarTail, lockMouseControl } from '@/utils';
import { Instruction } from '../Instruction/Instruction';

gsap.registerPlugin(ScrollTrigger);

export const ThreeScene: React.FC<IThreeScene> = ({ models, textures, specs, animationActions }: IThreeScene) => {
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
    const isScrolling = useRef<boolean>(false);

    const labelObjects = useRef<CSS2DObject[]>([]);
    const lerpCoordinatesRef = useRef<ILerpCoordinates[]>([]);
    const labelCoordinatesRef = useRef<ILabelPosition[][]>([]);

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
            div.style.marginTop = '10%';
        } else {
            div.textContent = content;
        }
        div.style.opacity = '0';

        const label = new CSS2DObject(div);
        label.position.copy(position);

        labelObjects.current.push(label); // Store the label object in the ref
        cssScene.add(label);
        return label;
    };



    const initializeCarsLayout = (
        webglScene: Scene,
        models: { [key: string]: GLTF }
    ) => {
        const lerpCoordinates: ILerpCoordinates[] = [];
        const labelCoordinates: ILabelPosition[][] = [];
        carNames.forEach((carName, index) => {
            const carModel = models[carName]!;
            carModel.scene.traverse(child => {
                if (child instanceof Mesh || child instanceof SkinnedMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const carCoor = carCoordinates[index]!;
            carModel.scene.scale.set(2.25, 2.25, 2.25); // Adjust scale for layout
            carModel.scene.position.set(carCoor.x, carCoor.y, carCoor.z);

            const carHood = getCarHood(carModel, degToRad(carCoor.rotation));

            const carTail = getCarTail(carModel, degToRad(carCoor.rotation));
            const carRightSide = getCarRightSide(carModel, degToRad(carCoor.rotation));

            carModel.scene.rotation.y = degToRad(carCoor.rotation); // Adjust rotation for layout

            webglScene.add(carModel.scene as unknown as Scene);

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

            carModel.scene.traverse(child => {
                if (child instanceof SkinnedMesh || child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    (child.material as MeshStandardMaterial).depthWrite = true;
                    (child.material as MeshStandardMaterial).depthTest = true;
                    (child.material as MeshStandardMaterial).alphaTest = 0.7;
                }
            });

            if (index === carNames.length - 1) {
                const carCenter = getCarCenter(carModel, degToRad(carCoor.rotation));
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
        lerpCoordinatesRef.current = lerpCoordinates;
        labelCoordinatesRef.current = labelCoordinates;
    }

    const createEndingScreen = () => {
        if (!cssScene) return;

        const div = document.createElement('div');
        div.className = 'ending-screen';
        div.innerHTML = `
            <div>
            <h1 class="ending-content">Thank you for watching!</h1>
            <p class="ending-content">Created by Thach Ngo</p>
            <p class="ending-content">2023</p>
            </div>
        `;
        div.style.position = 'absolute';
        div.style.top = '100%';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.style.zIndex = '1000';
        div.style.opacity = '1';

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';

        overlay.appendChild(div);
        const root = document.getElementById('root') as HTMLDivElement;
        root.appendChild(overlay);
    }

    const showEndingScreen = () => {
        const endingScreen = document.querySelector('.ending-screen');
        setIsFreelyViewing(0); // Lock the camera controls during the animation
        if (endingScreen) {
            const children = document.querySelectorAll('.ending-content');
            gsap.to(endingScreen, {
                top: '0',
                duration: 1,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(children, {
                        opacity: 1,
                        duration: 0.5,
                        stagger: 0.2, // adds delay between each animation
                        ease: 'power2.out',
                        onComplete: () => {

                            isScrolling.current = false; // Unlock scrolling after animation
                        }
                    });
                }
            });
        }
    }

    const hideEndingScreen = () => {
        const endingScreen = document.querySelector('.ending-screen') as HTMLDivElement;
        if (endingScreen) {
            const children = document.querySelectorAll('.ending-content');
            gsap.to(children, {
                opacity: 0,
                duration: 0.5,
                stagger: 0.2, // adds delay between each animation
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(endingScreen, {
                        top: '100%',
                        duration: 1,
                        ease: 'power2.out',
                        onComplete: () => {
                            setIsFreelyViewing(1);
                            isScrolling.current = false; // Unlock scrolling after animation
                            const overlay = document.querySelector('.overlay') as HTMLDivElement;
                            if (overlay) overlay.removeChild(endingScreen);
                        }
                    });
                }
            });
        }
    }

    const moveCamera = (prevIndex: number, nextIndex: number, camera: PerspectiveCamera) => {
        const lerpCoordinates = lerpCoordinatesRef.current;
        const labelCoordinates = labelCoordinatesRef.current;

        if (lerpCoordinates.length === 0) return;
        const oldTarget = lerpCoordinates[prevIndex];

        const newTarget = lerpCoordinates[nextIndex];

        if (!newTarget && !oldTarget) return;
        if (!initialCameraPosition) return; // Prevent animation if already animating

        const timeline = gsap.timeline();


        if (nextIndex === -1 && oldTarget) {
            // from 1 to 0
            timeline.to(camera.position, {
                x: initialCameraPosition.x,
                y: initialCameraPosition.y,
                z: initialCameraPosition.z,
                duration: 1, // Animation duration in seconds
                ease: 'expo.inOut', // Smooth easing
                onStart: () => {
                    setIsFreelyViewing(0); // Lock the camera controls during the animation
                    const oldLabels = document.querySelectorAll('.css-label');
                    if (oldLabels.length === 0) return;
                    gsap.to(oldLabels, {
                        opacity: 0,
                        duration: 0.2,
                        ease: 'power2.out',
                        onComplete: () => {
                            labelObjects.current.forEach(label => {
                                cssScene!.remove(label); // Remove label after animation
                            });
                        }
                    });
                },
                onUpdate: () => {
                    camera.lookAt(new Vector3(oldTarget.x, oldTarget.y, oldTarget.z));
                },
                onComplete: () => {
                    timeline.clear().restart();
                    timeline.to(camera.position, {
                        duration: 0.5, // Duration for lerping
                        ease: 'expo.out', // Smooth easing
                        onUpdate: () => {
                            const lerpTarget = new Vector3().lerpVectors(
                                new Vector3(oldTarget.x, oldTarget.y, oldTarget.z),
                                new Vector3(
                                    initialCameraPosition.x,
                                    initialCameraPosition.y,
                                    initialCameraPosition.z - 1
                                ),
                                timeline.progress()
                            );
                            camera.lookAt(lerpTarget); // Smoothly transition the camera's lookAt target
                        },
                        onComplete: () => {
                            setIsFreelyViewing(1); // Unlock the camera controls after the animation
                            isScrolling.current = false; // Unlock scrolling after animation
                        }
                    });
                }
            });
        } else {
            // from 1 to end
            if (nextIndex > lerpCoordinates.length) {
                return;
            }
            if (oldTarget) {
                if (nextIndex !== lerpCoordinates.length) {
                    if (lerpCoordinates[nextIndex]?.index === carNames.indexOf('lamborghiniCentenario')) {
                        if (lerpCoordinates[prevIndex]?.index !== carNames.indexOf('lamborghiniCentenario'))
                            playAnimationOnce(animationActions['lamborghiniCentenario']!);
                    } else {
                        if (lerpCoordinates[prevIndex]?.index === carNames.indexOf('lamborghiniCentenario'))
                            playAnimationReverse(animationActions['lamborghiniCentenario']!);
                    }
                }
                timeline.to(camera.position, {
                    duration: 0.5, // Duration for lerping
                    onStart: () => {
                        const oldLabels = document.querySelectorAll('.css-label');
                        setIsFreelyViewing(0); // Lock the camera controls during the animation
                        if (oldLabels.length === 0) {
                            if (nextIndex === lerpCoordinates.length - 1) {
                                createEndingScreen();
                            }
                            if (!labelCoordinates[nextIndex] || nextIndex > lerpCoordinates.length - 1) return;
                            labelCoordinates[nextIndex].forEach(label => {
                                create2DCSSElement(
                                    label.content ? label.content : '',
                                    new Vector3(label.x, label.y, label.z),
                                    carNames[lerpCoordinates[nextIndex]!.index]
                                );
                            });
                            return;
                        }
                        gsap.to(oldLabels, {
                            opacity: 0,
                            duration: 0.2,
                            ease: 'power2.out',
                            onComplete: () => {
                                labelObjects.current.forEach(label => {
                                    cssScene!.remove(label); // Remove label after animation
                                });
                                if (nextIndex === lerpCoordinates.length - 1) {
                                    createEndingScreen();
                                }
                                if (!labelCoordinates[nextIndex] || nextIndex > lerpCoordinates.length - 1) return;
                                labelCoordinates[nextIndex].forEach(label => {
                                    create2DCSSElement(
                                        label.content ? label.content : '',
                                        new Vector3(label.x, label.y, label.z),
                                        carNames[lerpCoordinates[nextIndex]!.index]
                                    );
                                });
                            }
                        });

                    },
                    onUpdate: () => {
                        if (!newTarget) return;
                        const lerpTarget = new Vector3().lerpVectors(
                            new Vector3(oldTarget.x, oldTarget.y, oldTarget.z),
                            new Vector3(newTarget.x, newTarget.y, newTarget.z),
                            timeline.progress()
                        );
                        camera.lookAt(lerpTarget); // Smoothly transition the camera's lookAt target

                    },
                    onComplete: () => {
                        if (nextIndex >= lerpCoordinates.length) {
                            showEndingScreen();
                            return;
                        }
                        if (!newTarget) return;
                        timeline.clear().restart();
                        timeline.to(
                            camera.position,
                            {
                                x: newTarget.x + (newTarget.deltaX ?? 0),
                                y: newTarget.y + (newTarget.deltaY ?? 0),
                                z: newTarget.z + (newTarget.deltaZ ?? 0),
                                duration: 1, // Animation duration in seconds
                                ease: 'expo.out', // Smooth easing
                                onUpdate: () => {
                                    // const cssLabels = document.querySelectorAll('.css-label');
                                    if (prevIndex === lerpCoordinates.length - 2 && nextIndex === lerpCoordinates.length - 1) {
                                        camera.lookAt(new Vector3(newTarget.x, newTarget.y, newTarget.z + 1));
                                    }
                                    else {
                                        camera.lookAt(new Vector3(newTarget.x, newTarget.y, newTarget.z)); // Keep looking at the new target
                                    }
                                },
                                onComplete: () => {
                                    const cssLabels = document.querySelectorAll('.css-label');
                                    if (cssLabels.length > 0) {
                                        gsap.to(cssLabels, {
                                            opacity: 1,
                                            duration: 0.2,
                                            stagger: 0.1, // adds delay between each animation
                                            ease: 'power2.out'
                                        });
                                    }
                                    // Reach the last lerp destination
                                    setIsFreelyViewing(1); // Unlock the camera controls after the animation
                                    isScrolling.current = false; // Unlock scrolling after animation
                                }
                            },
                            '+=0' // Start after the lerping is complete
                        );
                    },
                    ease: 'expo.inOut'
                });
            } else {
                if (!newTarget) return;

                if (prevIndex === lerpCoordinates.length) {
                    const endScene = document.querySelector('.ending-screen') as HTMLDivElement;
                    if (endScene) {
                        hideEndingScreen();
                    }
                    return;
                } else {

                    // from 0 to 1
                    timeline.to(camera.position, {
                        duration: 0.5, // Duration for lerping
                        onStart: () => {
                            setIsFreelyViewing(0); // Lock the camera controls during the animation
                            labelCoordinates[nextIndex]!.forEach(label => {
                                create2DCSSElement(
                                    label.content ? label.content : '',
                                    new Vector3(label.x, label.y, label.z),
                                    carNames[lerpCoordinates[nextIndex]!.index]
                                );
                            });
                        },
                        onUpdate: () => {
                            const lerpTarget = new Vector3().lerpVectors(
                                new Vector3(
                                    initialCameraPosition.x,
                                    initialCameraPosition.y,
                                    initialCameraPosition.z - 1
                                ),
                                new Vector3(newTarget.x, newTarget.y, newTarget.z),
                                timeline.progress()
                            );
                            camera.lookAt(lerpTarget); // Smoothly transition the camera's lookAt target
                        },
                        onComplete: () => {
                            timeline.clear().restart();
                            timeline.to(
                                camera.position,
                                {
                                    x: newTarget.x + (newTarget.deltaX ?? 0),
                                    y: newTarget.y + (newTarget.deltaY ?? 0),
                                    z: newTarget.z + (newTarget.deltaZ ?? 0),
                                    duration: 1, // Animation duration in seconds
                                    ease: 'expo.out', // Smooth easing
                                    onUpdate: () => {
                                        camera.lookAt(new Vector3(newTarget.x, newTarget.y, newTarget.z)); // Keep looking at the new target
                                    },
                                    onComplete: () => {
                                        const cssLabels = document.querySelectorAll('.css-label');
                                        gsap.to(cssLabels, {
                                            opacity: 1,
                                            duration: 0.2,
                                            stagger: 0.1, // adds delay between each animation
                                            ease: 'power2.out'
                                        });
                                        isScrolling.current = false; // Unlock scrolling after animation
                                        setIsFreelyViewing(1); // Unlock the camera controls after the animation
                                    }
                                },
                                '+=0' // Start after the lerping is complete
                            );
                        },
                        ease: 'expo.inOut'
                    });
                }
            }
        }
    };

    // ONLY FOR DEBUG
    // useEffect(() => {
    //   if (!scene || !camera || !webglRenderer || !isLoaded || !controls) return;

    //   enableDebugMode(camera, webglRenderer.domElement.ownerDocument);
    // }, [scene, camera, webglRenderer, isLoaded]);

    // Debounced function to prevent excessive scrolling
    const handleWheel = useCallback((event: WheelEvent) => {
        if (isScrolling.current) return;

        isScrolling.current = true;

        setCurrentIndex(prevIndex => {
            let newIndex;
            if (event.deltaY > 0) {
                newIndex = Math.min(prevIndex + 1, lerpCoordinatesRef.current.length);
            } else {
                newIndex = Math.max(prevIndex - 1, -2);
            }
            moveCamera(prevIndex, newIndex, camera!);
            return newIndex;
        });
    }, [camera]);

    useGSAP(() => {
        if (!camera) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            handleWheel(e);
        };

        window.addEventListener('wheel', wheelHandler, { passive: false });

        return () => {
            window.removeEventListener('wheel', wheelHandler);
        };
    }, [camera]);


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

        if (warehouseTexture) {
            warehouseTexture.mapping = EquirectangularReflectionMapping;
            webglScene.environment = warehouseTexture;
        }

        models['warehouse']!.scene.traverse(child => {
            if (child instanceof Mesh || child instanceof SkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        webglScene.add(models['warehouse']!.scene);

        if (!isRenderedShadow) {
            initializeCarsLayout(webglScene, models);
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


    return <>
        <Instruction />
        <div ref={mountRef} className='three-scene-wrapper' />;
    </>
};

export default ThreeScene;