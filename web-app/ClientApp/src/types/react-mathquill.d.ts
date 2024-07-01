// src/types/react-mathquill.d.ts
declare module 'react-mathquill' {
  import { Component } from 'react';

  export interface MathQuillProps {
    latex: string | undefined;
    onChange?: (mathField: MathField) => void;
    config?: object;
    children?: React.ReactNode;
  }

  export class EditableMathField extends Component<MathQuillProps> {}
  export class StaticMathField extends Component<MathQuillProps> {}

  export interface MathField {
    latex: () => string;
    cmd: (latexString: string) => void;
    write: (latexString: string) => void;
    select: () => void;
    clearSelection: () => void;
    moveToLeftEnd: () => void;
    moveToRightEnd: () => void;
    keystroke: (keys: string) => void;
    typedText: (text: string) => void;
    config: (config: object) => void;
    focus: () => void;
    blur: () => void;
  }
}
