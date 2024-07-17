import React, { useEffect, useState, ChangeEvent, useRef} from 'react';
import { addStyles, EditableMathField, MathField } from 'react-mathquill';


// inserts the required css to the <head> block.
// you can skip this, if you want to do that by yourself.
addStyles();

interface Props {
    handleChange?: (mainIndex: number, manualValue: string, subIndex?: number) => void;
    mainIndex?: number;
    subIndex?: number;
    onFocus: (mathField: MathField) => void;
    setActiveInputRef: (mathField: MathField) => void;
}
export const MathInput = ({handleChange, mainIndex, subIndex, onFocus, setActiveInputRef}: Props) => {
  const [latex, setLatex] = useState("");
  const mathFieldRef = useRef<MathField | null>(null);

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
                    onFocus={() => {
                      if (mathFieldRef.current) {
                        onFocus(mathFieldRef.current);
                      }
                    }}
                    onChange={(mathField) => {
                        setLatex(mathField.latex())
                    }}

                    mathquillDidMount={(mathField) => {
                      mathFieldRef.current = mathField;
                      setActiveInputRef(mathField);
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

