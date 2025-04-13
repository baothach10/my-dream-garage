import React from 'react';

import LoadingScene from './components/LoadingScene/LoadingScene';
import ThreeScene from './components/scenes/ThreeScene';
import { useAssets } from './context/AssetLoaderContext';

const App: React.FC = () => {
    const { isLoaded,
        progress,
        textures,
        models,
        animationActions,
        animationMixers,
        specs } = useAssets()

    return isLoaded ? <ThreeScene /> : <LoadingScene percentage={progress} />
};

export default App;