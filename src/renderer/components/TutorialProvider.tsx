import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
    targetSelector: string;
    title: string;
    content: ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialContextType {
    isActive: boolean;
    currentStepIndex: number;
    steps: TutorialStep[];
    startTutorial: (steps: TutorialStep[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    endTutorial: () => void;
    currentStep: TutorialStep | null;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [steps, setSteps] = useState<TutorialStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const startTutorial = (newSteps: TutorialStep[]) => {
        setSteps(newSteps);
        setCurrentStepIndex(0);
        setIsActive(true);
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTutorial();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const endTutorial = () => {
        setIsActive(false);
        setCurrentStepIndex(0);
        setSteps([]);
    };

    const currentStep = isActive && steps.length > 0 ? steps[currentStepIndex] : null;

    return (
        <TutorialContext.Provider
            value={{
                isActive,
                currentStepIndex,
                steps,
                startTutorial,
                nextStep,
                prevStep,
                endTutorial,
                currentStep
            }}
        >
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}
