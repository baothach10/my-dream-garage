import React from 'react';

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

    return 1 != 1 ? <ThreeScene textures={textures} models={models} specs={specs} animationMixers={animationMixers} animationActions={animationActions} /> : <LoadingScene percentage={progress} />
};

export default App;