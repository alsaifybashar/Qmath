'use client';

import { useEffect } from 'react';

const PRESSABLE_SELECTOR = [
    'button:not(:disabled)',
    'a[href]:not([aria-disabled="true"])',
    '[role="button"]:not([aria-disabled="true"])',
    'summary',
    'input[type="button"]:not(:disabled)',
    'input[type="submit"]:not(:disabled)',
    'input[type="reset"]:not(:disabled)',
].join(',');

export function MotionPressFeedback() {
    useEffect(() => {
        let activePressable: HTMLElement | null = null;

        const clearPress = () => {
            activePressable?.removeAttribute('data-pointer-press');
            activePressable = null;
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;

            const target = event.target instanceof Element
                ? event.target.closest<HTMLElement>(PRESSABLE_SELECTOR)
                : null;
            if (!target) return;

            clearPress();
            activePressable = target;
            activePressable.setAttribute('data-pointer-press', 'true');
        };

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('pointerup', clearPress, true);
        document.addEventListener('pointercancel', clearPress, true);
        window.addEventListener('blur', clearPress);

        return () => {
            clearPress();
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('pointerup', clearPress, true);
            document.removeEventListener('pointercancel', clearPress, true);
            window.removeEventListener('blur', clearPress);
        };
    }, []);

    return null;
}
