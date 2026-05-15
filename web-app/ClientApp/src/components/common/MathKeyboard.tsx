import React, { useState, MutableRefObject, act } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { MathStatic } from '../common/MathStatic';
import { MathField } from 'react-mathquill';
import { MathLatex } from '../../enums/enumerables';

interface DraggableDialogProps {
  isVisible: boolean;
  activeInputRef: MathField | null;
  // setActiveInputRef: (mathField: MathField) => void;
}


export const MathKeyBoard: React.FC<DraggableDialogProps> = ({ isVisible, activeInputRef/*, setActiveInputRef */}) => {
  const [position, setPosition] = useState({ top: 50, left: 50 });
  const [visible, setVisible] = useState<boolean>(isVisible);

  const handleClick = (latex: string) => {
    if(activeInputRef){
      activeInputRef.write(latex);
      activeInputRef.focus();
    }
  }

  const onHide = () => { 
      setVisible(false);
    }

  // const handleFocus = (mathField: MathField | null) => {
  //   if(mathField)
  //     setActiveInputRef(mathField);
  // };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    setPosition({
      top: e.clientY,
      left: e.clientX,
    });
  };

  return (
    <>
      <Button onClick={() => setVisible(!visible)}>Keyboard</Button>
      <div className='keyboard-dialog'>
        <Dialog
          header="Math Keyboard"
          visible={visible}
          style={{
            width: '300px',
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            border: '1px solid black', // Correct border style
            borderRadius: '10px', // Correct border radius
            padding: '10px', // Correct padding
            background: "white"
          }}
          onHide={onHide}
          modal={false}
          draggable
          onDrag={(e: React.DragEvent<HTMLDivElement>) => handleDrag(e)}
          >
          <div className='keyboard-dialog-div'>
            {Object.values(MathLatex).map((char) => (
                <Button key={char} onClick={() => handleClick(char)} style={{}}><MathStatic latex={char}></MathStatic></Button>
              ))}
          </div>
        </Dialog>
        </div>
      <style>
      {
        `
        
          .keyboard-dialog-div {
            background: grey;
          }
        `
      }
      </style>
      </>
  );
};