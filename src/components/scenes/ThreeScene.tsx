import React, { useEffect, useRef } from 'react';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

const ThreeScene: React.FC = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Scene, Camera, Renderer
        const scene = new Scene();
        const camera = new PerspectiveCamera(
            75,
            mount.clientWidth / mount.clientHeight,
            0.1,
            1000
        );
        const renderer = new WebGLRenderer();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);

        // Add a Cube
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 5;

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup on unmount
        return () => {
            mount.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
};

export default ThreeScene;