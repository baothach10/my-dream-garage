import React from 'react';
import './LoadingScene.css';


type TLoadingSceneProps = {
    percentage: number;
};

export const LoadingScene = ({ percentage }: TLoadingSceneProps) => {

    return (
        <div className="loading-scene">
            <div className="banner">
                <div className="slider" style={{ "--quantity": 4 } as React.CSSProperties}>
                    <div className="item" style={{ "--position": 1 } as React.CSSProperties}><img src="/assets/images/lamborghiniLogo.png" alt="lamborghini logo" /></div>
                    <div className="item" style={{ "--position": 2 } as React.CSSProperties}><img src="/assets/images/koenigseggLogo.png" alt="koenigsegg logo" /></div>
                    <div className="item" style={{ "--position": 3 } as React.CSSProperties}><img src="/assets/images/mercedesLogo.png" alt="mercedes logo" /></div>
                    <div className="item" style={{ "--position": 4 } as React.CSSProperties}><img src="/assets/images/bugattiLogo.png" alt="bugatti logo" /></div>
                </div>
                <div className="content">
                    <h1 data-content="MY DREAM GARAGE">
                        MY DREAM GARAGE
                    </h1>
                    <div className="author">
                        <h2>Thach Ngo</h2>
                        <p>{percentage < 25 && "Loading textures and models..."}
                            {percentage >= 25 && percentage < 50 && "Loading car information..."}
                            {percentage >= 50 && percentage < 75 && "Initializing 3D mechanics..."}
                            {percentage >= 75 && percentage < 100 && "Finalizing setup..."}
                            {percentage >= 100 && "Ready to display!"}
                        </p>
                    </div>
                    <div className="model"></div>
                </div>
            </div>

        </div>
    );
};

export default LoadingScene;