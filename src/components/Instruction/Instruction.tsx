import './Instruction.css';

export const Instruction = () => {
    return (
        <div className="instruction-container">
            <div className="click-container">
                <div className="click-image">
                    <img src="assets/images/click.png" alt="click icon" />
                </div>
                <div className="click-text">Click into the screen to look around.</div>
            </div>
            <div className="escape-container">
                <div className="escape-image">
                    <img src="assets/images/escape.png" alt="escape icon" />
                </div>
                <div className="escape-text">Press Esc to quit looking around.</div>
            </div>
            <div className="scroll-container">
                <div className="scroll-image">
                    <img src="assets/images/scroll.png" alt="scroll icon" />
                </div>
                <div className="scroll-text">Scroll to explore more cars.</div>
            </div>
        </div>
    );
}