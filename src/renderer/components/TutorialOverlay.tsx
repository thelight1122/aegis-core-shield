import React, { useEffect, useState } from 'react';
import { useTutorial } from './TutorialProvider';
import './TutorialOverlay.css';

export default function TutorialOverlay() {
    const { isActive, currentStep, nextStep, prevStep, endTutorial, currentStepIndex, steps } = useTutorial();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isActive || !currentStep) {
            setTargetRect(null);
            return;
        }

        const updatePosition = () => {
            const el = document.querySelector(currentStep.targetSelector) as HTMLElement;
            if (el) {
                // Add a small padding around the element
                const rect = el.getBoundingClientRect();
                setTargetRect(new DOMRect(rect.left - 4, rect.top - 4, rect.width + 8, rect.height + 8));
            } else {
                console.warn(`Tutorial target not found: ${currentStep.targetSelector}`);
                // Fallback position if element is missing
                setTargetRect(new DOMRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100));
            }
        };

        const ensureVisibility = () => {
            const el = document.querySelector(currentStep.targetSelector) as HTMLElement;
            if (el) {
                const rect = el.getBoundingClientRect();
                const isOutOfView = 
                    rect.top < 100 || 
                    rect.bottom > (window.innerHeight - 100) ||
                    rect.left < 50 ||
                    rect.right > (window.innerWidth - 50);

                if (isOutOfView) {
                     el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }
        };

        // Initial update and add listeners for resize/scroll
        updatePosition();
        
        // Ensure visibility only once when the step mounts/changes
        setTimeout(ensureVisibility, 150);

        // Slight delay to allow DOM to settle after state changes (like switching views)
        const timeoutId = setTimeout(updatePosition, 300);

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            clearTimeout(timeoutId);
        };
    }, [isActive, currentStep]);

    if (!isActive || !currentStep || !targetRect) return null;

    // Calculate tooltip position relative to the spotlight
    const placement = currentStep.placement || 'right';
    let rawTop = targetRect.top;
    let rawLeft = targetRect.left;

    const SPACING = 16;
    const TOOLTIP_WIDTH = 320;

    switch (placement) {
        case 'right':
            rawTop = targetRect.top + targetRect.height / 2 - 100; // Roughly center vertically
            rawLeft = targetRect.right + SPACING;
            // Prevent going off right edge
            if (rawLeft + TOOLTIP_WIDTH > window.innerWidth) {
                rawLeft = targetRect.left - TOOLTIP_WIDTH - SPACING;
            }
            break;
        case 'left':
            rawTop = targetRect.top + targetRect.height / 2 - 100;
            rawLeft = targetRect.left - TOOLTIP_WIDTH - SPACING;
            // Prevent going off left edge
            if (rawLeft < 0) {
                rawLeft = targetRect.right + SPACING;
            }
            break;
        case 'bottom':
            rawTop = targetRect.bottom + SPACING;
            rawLeft = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
            // Prevent going off edges
            if (rawLeft < SPACING) rawLeft = SPACING;
            if (rawLeft + TOOLTIP_WIDTH > window.innerWidth - SPACING) rawLeft = window.innerWidth - TOOLTIP_WIDTH - SPACING;
            if (rawTop + 300 > window.innerHeight) rawTop = targetRect.top - 300 - SPACING;
            break;
        case 'top':
            rawTop = targetRect.top - 200 - SPACING; // Assuming max height ~200px
            rawLeft = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
            // Prevent going off edges
            if (rawLeft < SPACING) rawLeft = SPACING;
            if (rawLeft + TOOLTIP_WIDTH > window.innerWidth - SPACING) rawLeft = window.innerWidth - TOOLTIP_WIDTH - SPACING;
            if (rawTop < SPACING) rawTop = targetRect.bottom + SPACING;
            break;
    }

    const tooltipStyle: React.CSSProperties = {
        top: rawTop,
        left: rawLeft,
    };

    return (
        <>
            <div className="tutorial-overlay-backdrop" />
            
            <div 
                className="tutorial-spotlight"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                }}
            />

            <div className="tutorial-tooltip" style={tooltipStyle}>
                <div className="tutorial-tooltip-header">
                    <h4 className="tutorial-tooltip-title">{currentStep.title}</h4>
                    <span className="tutorial-tooltip-step">{currentStepIndex + 1} / {steps.length}</span>
                </div>
                
                <div className="tutorial-tooltip-content">
                    {currentStep.content}
                </div>

                <div className="tutorial-tooltip-actions">
                    <button className="btn-tutorial btn-tutorial-skip" onClick={endTutorial}>
                        {currentStepIndex === steps.length - 1 ? 'Close' : 'Skip Tutorial'}
                    </button>
                    {currentStepIndex > 0 && (
                        <button className="btn-tutorial btn-tutorial-skip" onClick={prevStep}>
                            Back
                        </button>
                    )}
                    <button className="btn-tutorial btn-tutorial-next" onClick={nextStep}>
                        {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </>
    );
}
