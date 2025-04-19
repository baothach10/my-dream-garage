import './EndingScene.css';

export const EndingScene: React.FC = () => {


    return (
        <div className="overlay">
            <div className="ending-scene">
                <h1 className='title ending-content'>My Dream Garage</h1>
                <h2 className='author ending-content'>Made by Thach Ngo</h2>
                <div className="credits-container">
                    <h3 className='section-title ending-content'>This website is made with</h3>
                    <div className="credits-track-container ending-content">
                        <ul className='credits-list list'>
                            <li >
                                <a className='list-item' href="https://threejs.org/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/threejs.png" alt="Three.js" />
                                </a>
                            </li>
                            <li>
                                <a className='list-item' href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/react.webp" alt="React" />
                                </a>
                            </li>
                            <li>
                                <a className='list-item' href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/typescript.png" alt="TypeScript" />
                                </a>
                            </li>
                            <li>
                                <a className='list-item' href="https://gsap.com/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/gsap.svg" alt="GSAP" />
                                </a>
                            </li>
                            <li>
                                <a className='list-item' href="https://www.blender.org/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/blender.png" alt="Blender" />
                                </a>
                            </li>
                            <li>
                                <a className='list-item' href="https://sketchfab.com/" target="_blank" rel="noopener noreferrer">
                                    <img src="assets/images/sketchfab.png" alt="Sketchfab" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="contact-container">
                    <h3 className='section-title ending-content'>Contact Me</h3>
                    <ul className='contact-list list'>
                        <li>
                            <a className='list-item' href="mailto:baothach10@gmail.com" target="_blank" rel="noopener noreferrer">
                                <img src="assets/images/gmail.png" alt="Gmail" />
                            </a>
                        </li>
                        <li>
                            <a className='list-item' href="https://www.linkedin.com/in/ngotranbaothach/" target="_blank" rel="noopener noreferrer">
                                <img src="assets/images/linkedin.png" alt="LinkedIn" />
                            </a>
                        </li>
                        <li>
                            <a className='list-item' href="https://github.com/baothach10" target="_blank" rel="noopener noreferrer">
                                <img src="assets/images/github.png" alt="GitHub" />
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="disclaimer-container">
                    <h3 className='section-title ending-content'>Disclaimer</h3>
                    <p className='disclaimer ending-content'>This website is a personal project and is not intended for commercial use.</p>
                </div>
            </div>
        </div>
    );
}