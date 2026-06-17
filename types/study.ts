
export type QuestionType =
    | 'multiple_choice'
    | 'numeric_input'
    | 'fill_blank'
    | 'guided_steps'
    | 'drag_drop'
    | 'toggle'
    | 'expression_builder'
    | 'cas_steps'
    | 'symbolic_input'
    | 'matrix_grid'
    | 'solution_steps'
    | 'rich_math_text'
    | 'solution_builder';

export type AnswerMode = QuestionType | 'numeric' | 'free_response' | 'free_form_symbolic';

export type SymbolicQuestionType =
    | 'algebra'
    | 'derivative'
    | 'integral'
    | 'limit'
    | 'other'
    | 'series'
    | 'trigonometry';

export interface SymbolicInputAnswerConfig {
    questionType?: SymbolicQuestionType;
    placeholder?: string;
    ignoreConstant?: boolean;
    showKeyboard?: boolean;
}

export interface SymbolicInputGradingConfig {
    exact?: string;
    acceptedForms?: string[];
    ignoreConstant?: boolean;
}

export type MatrixPresentationMode = 'matrix' | 'row_vector' | 'column_vector';

export interface MatrixGridAnswerConfig {
    initialRows?: number;
    initialCols?: number;
    minRows?: number;
    maxRows?: number;
    minCols?: number;
    maxCols?: number;
    allowResize?: boolean;
    placeholder?: string;
    presentation?: MatrixPresentationMode;
}

export interface MatrixGridGradingConfig {
    expectedValues: string[][];
    requireExactDimensions?: boolean;
}

export interface MatrixGridAnswerPayload {
    mode: 'matrix_grid';
    rows: number;
    cols: number;
    values: string[][];
}

export interface SolutionStepRule {
    prompt?: string;
    expectedAnswer: string;
    alternativeForms?: string[];
    hint?: string;
}

export interface SolutionStepsAnswerConfig {
    initialLineCount?: number;
    maxLines?: number;
    allowAddLine?: boolean;
    allowRemoveLine?: boolean;
    immediateValidation?: boolean;
    placeholder?: string;
}

export interface SolutionStepsGradingConfig {
    steps: SolutionStepRule[];
    requireAllSteps?: boolean;
    requireFinalAnswer?: boolean;
    finalAnswer?: string;
    finalAnswerAlternatives?: string[];
}

export interface SolutionStepsAnswerPayload {
    mode: 'solution_steps';
    lines: Array<{ id: string; value: string }>;
    finalAnswer?: string;
}

export type RichMathToolbarActionId =
    | 'bold'
    | 'italic'
    | 'bullet'
    | 'inline_math'
    | 'block_math'
    | 'fraction'
    | 'sqrt'
    | 'matrix';

export interface RichMathToolbarAction {
    id: RichMathToolbarActionId;
    label: string;
    snippet: string;
}

export interface RichMathTextAnswerConfig {
    toolbar?: RichMathToolbarAction[];
    requireFinalAnswer?: boolean;
    workingPlaceholder?: string;
    finalAnswerPlaceholder?: string;
}

export interface RichMathTextGradingConfig {
    finalAnswer?: string;
    acceptedForms?: string[];
}

export interface RichMathTextAnswerPayload {
    mode: 'rich_math_text';
    content: string;
    finalAnswer?: string;
}

export type StudentAnswerPayload =
    | string
    | string[]
    | Record<string, boolean>
    | MatrixGridAnswerPayload
    | SolutionStepsAnswerPayload
    | RichMathTextAnswerPayload;

// ============================================================================
// SHARED
// ============================================================================

export interface QuestionBase {
    id: string;
    type: QuestionType;
    topicId: string;
    difficulty: number;
}

export interface ErrorTrackingData {
    userId: string;
    questionId: string;
    questionType: QuestionType;
    topicId: string;
    errorType: 'conceptual' | 'procedural' | 'computational' | 'careless' | 'guessing' | 'partial' | 'unknown';
    userAnswer: any;
    correctAnswer: any;
    misconception?: string;
    attemptNumber: number;
    timeSpentMs: number;
    timestamp: Date;
}

// ============================================================================
// METHOD 1: MULTIPLE CHOICE
// ============================================================================

export interface MultipleChoiceQuestion extends QuestionBase {
    type: 'multiple_choice';
    question: {
        text: string;
        math?: string;   // LaTeX
        image?: string;
    };
    options: MultipleChoiceOption[];
    allowMultiple?: boolean;
    correctOptionId: string;
}

export interface MultipleChoiceOption {
    id: string;
    label: string;
    description?: string;
    formula?: string; // LaTeX
    isCorrect: boolean;
    feedback?: string; // Specific feedback if selected
}

// ============================================================================
// METHOD 2: NUMERIC INPUT
// ============================================================================

export interface NumericInputQuestion extends QuestionBase {
    type: 'numeric_input';
    question: {
        text: string;
        math?: string;
    };
    answer: {
        exact?: number;
        range?: [number, number];
        tolerance?: number;
        acceptedForms?: string[];
    };
    inputConfig: {
        allowDecimal?: boolean;
        allowNegative?: boolean;
        allowFraction?: boolean;
        maxDigits?: number;
        placeholder?: string;
    };
}

// ============================================================================
// METHOD 3: FILL IN BLANK
// ============================================================================

export interface FillBlankQuestion extends QuestionBase {
    type: 'fill_blank';
    question: {
        text: string; // "The derivative of sin(x) is {{0}} and the integral is {{1}}"
        math?: string;
    };
    blanks: {
        id: string;
        correctValues: string[]; // Accept variations
        placeholder?: string;
    }[];
}

// ============================================================================
// METHOD 5: DRAG & DROP (Ordering/Sorting)
// ============================================================================

export interface DragDropQuestion extends QuestionBase {
    type: 'drag_drop';
    question: {
        text: string;
    };
    items: {
        id: string;
        content: string; // Text or LaTeX
    }[];
    correctOrder: string[]; // Array of IDs in correct order
}

// ============================================================================
// METHOD 6: TOGGLE
// ============================================================================

export interface ToggleQuestion extends QuestionBase {
    type: 'toggle';
    question: {
        text: string;
    };
    items: {
        id: string;
        label: string;
        initialState?: boolean;
        correctState: boolean; // True or False
    }[];
}

// ============================================================================
// METHOD 7: EXPRESSION BUILDER
// ============================================================================

export interface ExpressionBuilderQuestion extends QuestionBase {
    type: 'expression_builder';
    question: {
        text: string;
    };
    availableBlocks: {
        id: string;
        text: string; // Text to display
        value: string; // LaTeX content or value
        type: 'number' | 'operator' | 'variable' | 'function';
    }[];
    correctExpression: string; // LaTeX or value string to match
    validationType: 'exact_match' | 'mathematical_equivalence'; // Latter requires advanced parsing engine, we'll stick to exact/string for now
}

// ============================================================================
// METHOD 8: CAS STEPS (Tonande Lösningssteg / Fading Steps)
// ============================================================================

export interface CasStepsQuestion extends QuestionBase {
    type: 'cas_steps';
    question: { text: string; math?: string };
}

export interface GuidedStepQuestion extends QuestionBase {
    type: 'guided_steps';
    problem: {
        title: string;
        statement: string;
        math?: string;
        context?: string;
    };
    steps: GuidedStep[];
    summary?: {
        title: string;
        finalAnswer: string;
    };
}

export type StepInputType = 'multiple_choice' | 'numeric_input' | 'fill_blank' | 'toggle';

export interface GuidedStep {
    id: string;
    stepNumber: number;
    instruction: string;
    question: string;
    context?: string; // Accumulated work

    inputType: StepInputType;
    // We can use a union or specific config for each. For simplicity, we'll embed the config.
    multipleChoiceConfig?: Omit<MultipleChoiceQuestion, 'id' | 'type' | 'topicId' | 'difficulty'>;
    numericInputConfig?: Omit<NumericInputQuestion, 'id' | 'type' | 'topicId' | 'difficulty'>;

    feedback: {
        correct: string;
        incorrect: string;
        hint?: string;
    };

    revealOnComplete?: string; // LaTeX to show after completion
}
