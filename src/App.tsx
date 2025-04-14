import React, { useEffect } from 'react';

import { LoadingScene } from './components/LoadingScene/LoadingScene';
import { ThreeScene } from './components/scenes/ThreeScene';
import { useAssets } from './context/AssetLoaderContext';

const App: React.FC = () => {
    const { isLoaded,
        progress,
        textures,
        models,
        animationActions,
        animationMixers,
        specs } = useAssets()

    const createOverlay = () => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'black';
        overlay.style.opacity = '1';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);
        return overlay;
    };

    const handleTransition = () => {
        const overlay = createOverlay();
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 1000); // Match the transition duration
        }, 500);
    };

    useEffect(() => {
        handleTransition();
    }, [isLoaded])

    return isLoaded ? <ThreeScene textures={textures} models={models} specs={specs} animationMixers={animationMixers} animationActions={animationActions} /> : <LoadingScene percentage={progress} />
};

export default App;