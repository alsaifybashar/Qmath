import { checkMathEquivalence } from '@/lib/utils/mathEquivalence';
import type {
    AnswerMode,
    MatrixGridAnswerPayload,
    MatrixGridGradingConfig,
    RichMathTextAnswerPayload,
    RichMathTextGradingConfig,
    SymbolicInputGradingConfig,
    SolutionStepsAnswerPayload,
    SolutionStepsGradingConfig,
    StudentAnswerPayload,
} from '@/types/study';

interface ValidationQuestionShape {
    type?: string | null;
    answerMode?: AnswerMode | null;
    correctAnswer?: unknown;
    content?: Record<string, any> | null;
    gradingConfig?: unknown;
}

const LEGACY_MODE_MAP: Record<string, AnswerMode> = {
    multiple_choice: 'multiple_choice',
    numeric: 'numeric_input',
    free_response: 'rich_math_text',
    free_form_symbolic: 'symbolic_input',
    numeric_input: 'numeric_input',
    symbolic_input: 'symbolic_input',
    matrix_grid: 'matrix_grid',
    solution_steps: 'solution_steps',
    rich_math_text: 'rich_math_text',
    fill_blank: 'fill_blank',
    guided_steps: 'guided_steps',
    drag_drop: 'drag_drop',
    toggle: 'toggle',
    expression_builder: 'expression_builder',
    cas_steps: 'cas_steps',
    solution_builder: 'solution_builder',
};

export function normalizeAnswerMode(question?: ValidationQuestionShape | null): AnswerMode {
    const rawMode = question?.answerMode ?? question?.type ?? 'numeric_input';
    return LEGACY_MODE_MAP[rawMode] ?? 'numeric_input';
}

export function serializeStudentAnswer(answer: StudentAnswerPayload | unknown): string {
    if (typeof answer === 'string') return answer;
    if (Array.isArray(answer)) return JSON.stringify(answer);
    if (answer && typeof answer === 'object') {
        if ('mode' in answer && answer.mode === 'matrix_grid') {
            const matrix = (answer as MatrixGridAnswerPayload).values;
            return matrix.map((row) => row.join(', ')).join(' ; ');
        }
        if ('mode' in answer && answer.mode === 'solution_steps') {
            return (answer as SolutionStepsAnswerPayload).lines.map((line) => line.value).join(' => ');
        }
        if ('mode' in answer && answer.mode === 'rich_math_text') {
            const richAnswer = answer as RichMathTextAnswerPayload;
            return richAnswer.finalAnswer?.trim() || richAnswer.content.trim();
        }
        return JSON.stringify(answer);
    }
    return String(answer ?? '');
}

export function validateStudentAnswer(
    question: ValidationQuestionShape | undefined,
    answer: StudentAnswerPayload,
    correctAnswer: unknown,
): boolean {
    const mode = normalizeAnswerMode(question);

    switch (mode) {
        case 'multiple_choice':
            return validateMultipleChoice(question, answer, correctAnswer);
        case 'symbolic_input':
            return validateSymbolicInputAnswer(answer, question?.gradingConfig as SymbolicInputGradingConfig | null | undefined, correctAnswer);
        case 'matrix_grid':
            return validateMatrixGridAnswer(answer, question?.gradingConfig as MatrixGridGradingConfig | null | undefined);
        case 'solution_steps':
            return validateSolutionStepsAnswer(answer, question?.gradingConfig as SolutionStepsGradingConfig | null | undefined);
        case 'rich_math_text':
            return validateRichMathTextAnswer(answer, question?.gradingConfig as RichMathTextGradingConfig | null | undefined, correctAnswer);
        case 'fill_blank':
            return validateFillBlankAnswer(question, answer);
        case 'drag_drop':
            return validateDragDropAnswer(question, answer);
        case 'toggle':
            return validateToggleAnswer(question, answer);
        case 'expression_builder':
            return validateExpressionBuilderAnswer(question, answer);
        case 'guided_steps':
        case 'solution_builder':
            return true;
        case 'numeric_input':
        case 'cas_steps':
        default:
            return checkMathEquivalence(serializeStudentAnswer(answer), correctAnswer);
    }
}

function validateSymbolicInputAnswer(
    answer: StudentAnswerPayload,
    gradingConfig: SymbolicInputGradingConfig | null | undefined,
    correctAnswer: unknown,
): boolean {
    if (typeof answer !== 'string') return false;

    const normalized = answer.trim();
    const exact = gradingConfig?.exact?.trim() || String(correctAnswer ?? '').trim();
    if (!exact) return false;

    if (checkMathEquivalence(normalized, exact)) return true;

    return Array.isArray(gradingConfig?.acceptedForms) &&
        gradingConfig.acceptedForms.some((form) => checkMathEquivalence(normalized, form));
}

function validateMultipleChoice(
    question: ValidationQuestionShape | undefined,
    answer: StudentAnswerPayload,
    correctAnswer: unknown,
): boolean {
    if (typeof answer !== 'string') return false;
    const correctOptionId = question?.content?.correctOptionId ?? (question as any)?.correctOptionId;
    if (typeof correctOptionId === 'string') {
        return answer === correctOptionId;
    }
    return checkMathEquivalence(answer, correctAnswer);
}

function validateFillBlankAnswer(question: ValidationQuestionShape | undefined, answer: StudentAnswerPayload): boolean {
    if (!Array.isArray(answer)) return false;
    const blanks = Array.isArray(question?.content?.blanks)
        ? question?.content?.blanks
        : Array.isArray((question as any)?.blanks)
            ? (question as any).blanks
            : [];
    return blanks.every((blank: any, index: number) => {
        const candidate = String(answer[index] ?? '');
        return Array.isArray(blank.correctValues) &&
            blank.correctValues.some((value: string) => checkMathEquivalence(candidate, value));
    });
}

function validateDragDropAnswer(question: ValidationQuestionShape | undefined, answer: StudentAnswerPayload): boolean {
    if (!Array.isArray(answer)) return false;
    const correctOrder = question?.content?.correctOrder ?? (question as any)?.correctOrder;
    return Array.isArray(correctOrder) &&
        JSON.stringify(answer) === JSON.stringify(correctOrder);
}

function validateToggleAnswer(question: ValidationQuestionShape | undefined, answer: StudentAnswerPayload): boolean {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;
    const items = Array.isArray(question?.content?.items)
        ? question?.content?.items
        : Array.isArray((question as any)?.items)
            ? (question as any).items
            : [];
    return items.every((item: any) => Boolean((answer as Record<string, boolean>)[item.id]) === Boolean(item.correctState));
}

function validateExpressionBuilderAnswer(question: ValidationQuestionShape | undefined, answer: StudentAnswerPayload): boolean {
    if (typeof answer !== 'string') return false;
    const correctExpression = question?.content?.correctExpression ?? (question as any)?.correctExpression;
    if (typeof correctExpression !== 'string') return false;

    if ((question?.content?.validationType ?? (question as any)?.validationType) === 'mathematical_equivalence') {
        return checkMathEquivalence(answer, correctExpression);
    }

    return normalizeString(answer) === normalizeString(correctExpression);
}

function validateMatrixGridAnswer(
    answer: StudentAnswerPayload,
    gradingConfig: MatrixGridGradingConfig | null | undefined,
): boolean {
    if (!gradingConfig?.expectedValues?.length) return false;
    if (!isMatrixAnswer(answer)) return false;

    const expectedValues = gradingConfig.expectedValues;
    const actualValues = answer.values;
    const requireExactDimensions = gradingConfig.requireExactDimensions ?? true;

    if (requireExactDimensions) {
        if (actualValues.length !== expectedValues.length) return false;
        if (actualValues.some((row, rowIndex) => row.length !== (expectedValues[rowIndex]?.length ?? 0))) return false;
    }

    if (actualValues.length < expectedValues.length) return false;

    return expectedValues.every((expectedRow, rowIndex) =>
        expectedRow.every((expectedCell, colIndex) =>
            checkMathEquivalence(actualValues[rowIndex]?.[colIndex] ?? '', expectedCell),
        ),
    );
}

function validateSolutionStepsAnswer(
    answer: StudentAnswerPayload,
    gradingConfig: SolutionStepsGradingConfig | null | undefined,
): boolean {
    if (!gradingConfig?.steps?.length) return false;
    if (!isSolutionStepsAnswer(answer)) return false;

    const expectedSteps = gradingConfig.steps.filter((step) => step.expectedAnswer.trim());
    const userLines = answer.lines
        .map((line) => line.value.trim())
        .filter(Boolean);

    const requireAllSteps = gradingConfig.requireAllSteps ?? true;
    const requireFinalAnswer = gradingConfig.requireFinalAnswer ?? false;
    const finalAnswer = answer.finalAnswer?.trim() || userLines[userLines.length - 1] || '';

    const linesAreCorrect = expectedSteps.every((step, index) => {
        const candidate = userLines[index] ?? '';
        if (checkMathEquivalence(candidate, step.expectedAnswer)) return true;
        return Array.isArray(step.alternativeForms) &&
            step.alternativeForms.some((alt) => checkMathEquivalence(candidate, alt));
    });

    if (requireAllSteps && (userLines.length < expectedSteps.length || !linesAreCorrect)) {
        return false;
    }

    if (!requireAllSteps) {
        const finalStep = expectedSteps[expectedSteps.length - 1];
        if (!checkMathEquivalence(finalAnswer, finalStep?.expectedAnswer ?? '')) {
            return false;
        }
    }

    if (requireFinalAnswer && gradingConfig.finalAnswer) {
        if (checkMathEquivalence(finalAnswer, gradingConfig.finalAnswer)) return true;
        return Array.isArray(gradingConfig.finalAnswerAlternatives) &&
            gradingConfig.finalAnswerAlternatives.some((alt) => checkMathEquivalence(finalAnswer, alt));
    }

    return true;
}

function validateRichMathTextAnswer(
    answer: StudentAnswerPayload,
    gradingConfig: RichMathTextGradingConfig | null | undefined,
    correctAnswer: unknown,
): boolean {
    const finalAnswer = isRichMathAnswer(answer)
        ? answer.finalAnswer?.trim() || answer.content.trim()
        : serializeStudentAnswer(answer).trim();

    const canonicalAnswer = gradingConfig?.finalAnswer ?? String(correctAnswer ?? '').trim();
    if (!canonicalAnswer) return false;

    if (checkMathEquivalence(finalAnswer, canonicalAnswer)) return true;

    return Array.isArray(gradingConfig?.acceptedForms) &&
        gradingConfig.acceptedForms.some((form) => checkMathEquivalence(finalAnswer, form));
}

function normalizeString(value: string): string {
    return value.replace(/\s+/g, '').trim().toLowerCase();
}

function isMatrixAnswer(answer: StudentAnswerPayload): answer is MatrixGridAnswerPayload {
    return typeof answer === 'object' &&
        answer !== null &&
        'mode' in answer &&
        answer.mode === 'matrix_grid' &&
        Array.isArray(answer.values);
}

function isSolutionStepsAnswer(answer: StudentAnswerPayload): answer is SolutionStepsAnswerPayload {
    return typeof answer === 'object' &&
        answer !== null &&
        'mode' in answer &&
        answer.mode === 'solution_steps' &&
        Array.isArray(answer.lines);
}

function isRichMathAnswer(answer: StudentAnswerPayload): answer is RichMathTextAnswerPayload {
    return typeof answer === 'object' &&
        answer !== null &&
        'mode' in answer &&
        answer.mode === 'rich_math_text' &&
        typeof answer.content === 'string';
}
