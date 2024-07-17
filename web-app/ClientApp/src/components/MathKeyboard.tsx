import React, { useState, MutableRefObject, act } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { MathStatic } from './MathStatic';
import { MathField } from 'react-mathquill';

interface DraggableDialogProps {
  visible: boolean;
  onHide: () => void;
  setVisible: (visible: boolean) => void;
  activeInputRef: MathField | null;
}

enum MathLatex{
  // Numbers
  ZERO = "0",
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",

  // Basic Operators
  ADD = "+",
  SUBTRACT = "-",
  MULTIPLY = "\\times",
  DIVIDE = "\\div",
  EQUALS = "=",
  LESS_THAN = "<",
  GREATER_THAN = ">",
  LESS_THAN_OR_EQUAL = "\\leq",
  GREATER_THAN_OR_EQUAL = "\\geq",
  NOT_EQUAL = "\\neq",

  // Greek Letters
  ALPHA = "\\alpha",
  BETA = "\\beta",
  GAMMA = "\\gamma",
  DELTA = "\\delta",
  EPSILON = "\\epsilon",
  ZETA = "\\zeta",
  ETA = "\\eta",
  THETA = "\\theta",
  IOTA = "\\iota",
  KAPPA = "\\kappa",
  LAMBDA = "\\lambda",
  MU = "\\mu",
  NU = "\\nu",
  XI = "\\xi",
  OMICRON = "\\omicron",
  PI = "\\pi",
  RHO = "\\rho",
  SIGMA = "\\sigma",
  TAU = "\\tau",
  UPSILON = "\\upsilon",
  PHI = "\\phi",
  CHI = "\\chi",
  PSI = "\\psi",
  OMEGA = "\\omega",

  // Advanced Operators
  INTEGRAL = "\\int",
  DOUBLE_INTEGRAL = "\\iint",
  TRIPLE_INTEGRAL = "\\iiint",
  SUMMATION = "\\sum",
  PRODUCT = "\\prod",
  FRACTION = "\\frac{}{}",
  SQUARE_ROOT = "\\sqrt{}",
  CUBE_ROOT = "\\sqrt[3]{}",
  NTH_ROOT = "\\sqrt[n]{}",
  EXPONENT = "^{}",
  SUBSCRIPT = "_{}",
  LOG = "\\log",
  NATURAL_LOG = "\\ln",

  // Trigonometric Functions
  SINE = "\\sin",
  COSINE = "\\cos",
  TANGENT = "\\tan",
  COSECANT = "\\csc",
  SECANT = "\\sec",
  COTANGENT = "\\cot",
  ASINE = "\\arcsin",
  ACOSINE = "\\arccos",
  ATANGENT = "\\arctan",

  // Geometry
  DEGREE = "^\\circ",
  ANGLE = "\\angle",
  RIGHT_ANGLE = "\\rightangle",
  PARALLEL = "\\parallel",
  PERPENDICULAR = "\\perp",
  CONGRUENT = "\\cong",
  SIMILAR = "\\sim",

  // Approximation
  APPROXIMATELY_EQUAL = "\\approx",

  // Set Theory
  ELEMENT_OF = "\\in",
  NOT_ELEMENT_OF = "\\notin",
  SUBSET = "\\subset",
  SUPERSET = "\\supset",
  SUBSET_EQUAL = "\\subseteq",
  SUPERSET_EQUAL = "\\supseteq",
  UNION = "\\cup",
  INTERSECTION = "\\cap",
  EMPTY_SET = "\\emptyset",

  // Calculus
  INCREMENT = "\\Delta",
  NABLA = "\\nabla",
  PARTIAL = "\\partial",

  // Vectors and Matrices
  VECTOR = "\\vec{}",
  MATRIX = "\\begin{matrix} \\end{matrix}",

  // Probability and Statistics
  EXPECTATION = "\\mathbb{E}",
  VARIANCE = "\\text{Var}",
  COVARIANCE = "\\text{Cov}",
  BINOMIAL_COEFFICIENT = "\\binom{}{}",
  PERMUTATION = "P",

  // Others
  ABSOLUTE_VALUE = "| |",
  FLOOR_FUNCTION = "\\lfloor \\rfloor",
  CEILING_FUNCTION = "\\lceil \\rceil",
  FACTORIAL = "!",
  MODULO = "\\mod",
  CEILING = "\\lceil \\rceil",
  FLOOR = "\\lfloor \\rfloor",

  // Relations and Logic
  IMPLIES = "\\implies",
  IF_AND_ONLY_IF = "\\iff",
  FOR_ALL = "\\forall",
  EXISTS = "\\exists",
  DOES_NOT_EXIST = "\\nexists",
  AND = "\\land",
  OR = "\\lor",
  NOT = "\\neg",
  THEREFORE = "\\therefore",
  BECAUSE = "\\because",
  SIMILAR_TO = "\\sim",
  PROPORTIONAL_TO = "\\propto",

  PLUS_MINUS = "\\pm",
  MINUS_PLUS = "\\mp",
  TIMES = "\\times",
  EQUAL = "=",
  IDENTICAL_TO = "\\equiv",
  APPROXIMATELY_EQUAL_TO = "\\approx",
  NOT_APPROXIMATELY_EQUAL_TO = "\\napprox",

  // Binary Operators
  DOT_PRODUCT = "\\cdot",
  CROSS_PRODUCT = "\\times",
  LOGICAL_AND = "\\land",
  LOGICAL_OR = "\\lor",

  // Algebra
  VARIABLE_X = "x",
  VARIABLE_Y = "y",
  VARIABLE_Z = "z",
  VARIABLE_A = "a",
  VARIABLE_B = "b",
  VARIABLE_C = "c",
  VARIABLE_D = "d",
  VARIABLE_E = "e",
  VARIABLE_F = "f",

  // Advanced Functions
  LIM = "\\lim_{x \\to \\infty}",
  DERIVATIVE = "\\frac{d}{dx}",
  PARTIAL_DERIVATIVE = "\\frac{\\partial}{\\partial x}",
  DOUBLE_PARTIAL_DERIVATIVE = "\\frac{\\partial^2}{\\partial x^2}",
  GRADIENT = "\\nabla f",
  DIVERGENCE = "\\nabla \\cdot F",
  CURL = "\\nabla \\times F",

  // Matrix and Determinants
  DETERMINANT = "\\det",
  TRACE = "\\text{tr}",
  TRANSPOSE = "A^T",
  INVERSE = "A^{-1}",

  // Complex Numbers
  REAL_PART = "\\Re",
  IMAGINARY_PART = "\\Im",
  COMPLEX_CONJUGATE = "\\bar{z}",
  MODULUS = "|z|",

  // Sets and Probability
  COMPLEMENT = "A^c",
  PROBABILITY = "\\mathbb{P}",

  // Angle Measures
  RADIAN = "rad",
  GRADIAN = "grad",

  // Logic and Set Theory
  TRUE = "\\text{true}",
  FALSE = "\\text{false}",
  LOGICAL_TRUE = "\\top",
  LOGICAL_FALSE = "\\bot",
  NOT_SUBSET = "\\nsubseteq",
  NOT_SUPERSET = "\\nsupseteq",

  // Others
  INFINITY = "\\infty",
  LOG_BASE_2 = "\\log_2",
  LOG_BASE_10 = "\\log_{10}",
  PARALLELOGRAM = "ABCD",
  TRIANGLE = "\\triangle",
  CIRCLE = "\\circ",
  ELLIPSE = "\\ellipse",
  SQUARE = "\\square",
  RECTANGLE = "\\rectangle",
  DIAMOND = "\\diamond",
  RHOMBUS = "\\rhombus",
  TRAPEZOID = "\\trapezoid",
  POLYGON = "\\polygon"
}




export const MathKeyBoard: React.FC<DraggableDialogProps> = ({ visible, onHide, setVisible, activeInputRef }) => {
  const [position, setPosition] = useState({ top: 50, left: 50 });


  const handleClick = (latex: string) => {
    if(activeInputRef){
      activeInputRef.write(latex);
      activeInputRef.focus();
    }
  }

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