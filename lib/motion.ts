export const motionDuration = {
    press: 0.12,
    correct: 0.15,
    fast: 0.18,
    wrong: 0.2,
    base: 0.22,
    slow: 0.28,
} as const;

export const motionEase = {
    out: [0.23, 1, 0.32, 1] as [number, number, number, number],
    inOut: [0.77, 0, 0.175, 1] as [number, number, number, number],
    drawer: [0.32, 0.72, 0, 1] as [number, number, number, number],
} as const;

export const shellSpring = {
    type: 'spring' as const,
    duration: 0.5,
    bounce: 0.25,
};

export const focusSpring = {
    type: 'spring' as const,
    duration: motionDuration.base,
    bounce: 0,
};

export const drawerTransition = {
    duration: 0.5,
    ease: motionEase.drawer,
};

export const focusTransition = {
    duration: motionDuration.base,
    ease: motionEase.out,
};

