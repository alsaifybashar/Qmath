'use client';

import { useEffect, useRef } from 'react';

export default function ConstellationBG() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w: number, h: number;
        let points: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
        let animId: number;

        function resize() {
            if (!canvas) return;
            w = canvas.width = canvas.offsetWidth;
            h = canvas.height = canvas.offsetHeight;
        }

        function init() {
            resize();
            points = [];
            const count = Math.floor((w * h) / 18000);
            for (let i = 0; i < count; i++) {
                points.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.15,
                    r: Math.random() * 1.5 + 0.5,
                });
            }
        }

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            for (const p of points) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(107,113,148,0.18)';
                ctx.fill();
            }

            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dx = points[i].x - points[j].x;
                    const dy = points[i].y - points[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(points[i].x, points[i].y);
                        ctx.lineTo(points[j].x, points[j].y);
                        ctx.strokeStyle = `rgba(107,113,148,${0.06 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        }

        init();
        draw();

        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />
    );
}
