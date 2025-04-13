import React from 'react';
import './LoadingScene.css';


type TLoadingSceneProps = {
    percentage: number;
};

export const LoadingScene = ({ percentage }: TLoadingSceneProps) => {
    return (
        <div>
            <h1>Loading...</h1>
            {percentage}
        </div>
    );
};

export default LoadingScene;