import React, { useEffect, useState, ChangeEvent} from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';

// inserts the required css to the <head> block.
// you can skip this, if you want to do that by yourself.
addStyles();

interface Props {
    handleChange?: (mainIndex: number, manualValue: string, subIndex?: number) => void;
    mainIndex?: number;
    subIndex?: number;
}
export const MathInput = ({handleChange, mainIndex, subIndex}: Props) => {
  const [latex, setLatex] = useState("");

  useEffect(() => {
    if(latex && handleChange && mainIndex!==undefined){
        if(subIndex!==undefined){
            handleChange(mainIndex, latex, subIndex);
            console.log("Ran handleChange sub useEffect in MathInput component");
        } 
        else{
            handleChange(mainIndex, latex);
            console.log("Ran handleChange main useEffect in MathInput component");
        } 
    }
  }, [latex]);

  return (
    <>
            <div>
                <EditableMathField
                    latex={latex}
                    onChange={(mathField) => {
                        setLatex(mathField.latex())
                    }}
                />
            </div>
            <style>{`
              .mq-editable-field {
                background: white;
                width: 100%;
              }
            `}</style>
    </>
  )
}

