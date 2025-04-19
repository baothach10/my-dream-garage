import { gsap } from 'gsap';
import { useEffect } from 'react';

import './MobileScene.css';
import { MobileLinkButton } from '../MobileLinkButton/MobileLinkButton';

export const MobileScene: React.FC = () => {

    useEffect(() => {
        const timeline = gsap.timeline();

        timeline
            .from('.mobile-credits-container', { opacity: 0, y: 50, duration: 0.5 }, '+=0.5')
            .from('.mobile-contact-container', { opacity: 0, y: 50, duration: 0.5 }, '+=0.5')
            .from('.mobile-list-item', { opacity: 0, stagger: 0.2 }, '+=0.5')
    }, []);
    return (
        <div className="mobile-scene">
            <div className="content">
                <h1>
                    MY DREAM GARAGE
                </h1>
                <div className="author">
                    <h2>by Thach Ngo</h2>
                    <h3>This experience is designed for desktop.</h3>
                    <p>Please visit this site using a laptop or desktop computer for the best experience.</p>
                </div>
                <div className="model"></div>
            </div>
            <div className="mobile-credits-container">
                <h3 className='section-title mobile-content'>This website is made with</h3>
                <div className="mobile-credits-track-container mobile-content">
                    <ul className='mobile-credits-list mobile-list'>
                        {[
                            { href: "https://threejs.org/", src: "assets/images/threejs.png", alt: "Threejs" },
                            { href: "https://reactjs.org/", src: "assets/images/react.webp", alt: "React" },
                            { href: "https://www.typescriptlang.org/", src: "assets/images/typescript.png", alt: "TypeScript" },
                            { href: "https://gsap.com/", src: "assets/images/gsap.svg", alt: "GSAP" },
                            { href: "https://www.blender.org/", src: "assets/images/blender.png", alt: "Blender" },
                            { href: "https://sketchfab.com/", src: "assets/images/sketchfab.png", alt: "Sketchfab" },
                        ].map((item, index) => (
                            <li key={index}>
                                <div className={`mobile-list-item ${item.alt}`}>
                                    <MobileLinkButton href={item.href} name={item.alt}>
                                        <img src={item.src} alt={item.alt} />
                                    </MobileLinkButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="mobile-contact-container">
                <h3 className='section-title mobile-content'>Contact Me</h3>
                <ul className='mobile-contact-list mobile-list'>
                    {[
                        { href: "mailto:baothach10@gmail.com", src: "assets/images/gmail.png", alt: "Gmail" },
                        { href: "https://www.linkedin.com/in/ngotranbaothach/", src: "/assets/images/linkedin.png", alt: "LinkedIn" },
                        { href: "https://github.com/baothach10", src: "assets/images/github.png", alt: "GitHub" },
                    ].map((item, index) => (
                        <li key={index}>
                            <div className={`mobile-list-item ${item.alt}`}>
                                <MobileLinkButton href={item.href} name={item.alt}>
                                    <img src={item.src} alt={item.alt} />
                                </MobileLinkButton>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}