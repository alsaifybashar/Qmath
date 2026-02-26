import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InteractiveWidgetWrapperProps {
  children: React.ReactNode;
  title?: string;
  scoreboard?: React.ReactNode;
  className?: string;
}

export function InteractiveWidgetWrapper({
  children,
  title,
  scoreboard,
  className
}: InteractiveWidgetWrapperProps) {
  return (
    <div className={cn(
      "relative w-full h-full min-h-[400px] overflow-hidden rounded-xl",
      "bg-slate-950 flex flex-col items-center justify-start py-8",
      className
    )}>
      {/* 3D Grid Floor Effect */}
      <div 
        className="absolute bottom-0 w-full h-[60%] opacity-40 pointer-events-none"
        style={{
          perspective: "600px",
          overflow: "hidden"
        }}
      >
        <div 
          className="w-[200%] h-[200%] absolute left-[-50%] top-0"
          style={{
            transform: "rotateX(75deg) translateY(-20%)",
            transformOrigin: "center top",
            backgroundImage: `
              linear-gradient(to right, #06b6d4 1px, transparent 1px),
              linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />
        {/* Dark fade out to horizon */}
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" />
      </div>

      {/* Header / Scoreboard Area */}
      <div className="relative z-10 w-full max-w-3xl flex justify-between items-center px-6 mb-8">
        <div className="flex items-center space-x-2">
           {title && <h3 className="text-white font-semibold text-lg">{title}</h3>}
        </div>
        <div>
          {scoreboard}
        </div>
      </div>

      {/* Main Interactive Area */}
      <div className="relative z-10 w-full flex-grow flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
