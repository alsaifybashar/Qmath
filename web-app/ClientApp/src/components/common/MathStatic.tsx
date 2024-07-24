import React from 'react'
import { addStyles, StaticMathField } from 'react-mathquill'

// inserts the required css to the <head> block.
// you can skip this, if you want to do that by yourself.
addStyles()

interface Props {
    latex?: string 
}

export const MathStatic = ({latex="\\frac{1}{\\sqrt{2}}\\cdot 2"}: Props) => (
  <StaticMathField>{latex}</StaticMathField>
)