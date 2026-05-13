'use client';

import MathCASInput from '@/components/study/MathCASInput';
import type {
    SymbolicInputAnswerConfig,
    SymbolicInputGradingConfig,
    SymbolicQuestionType,
} from '@/types/study';

interface SymbolicInputQuestionLike {
    id: string;
    type: 'symbolic_input';
    topicId: string;
    difficulty: number;
    correctAnswer?: unknown;
    answerConfig?: SymbolicInputAnswerConfig | null;
    gradingConfig?: SymbolicInputGradingConfig | null;
}

interface SymbolicMathInputProps {
    question: SymbolicInputQuestionLike;
    onAnswer: (answer: string, isCorrect: boolean) => void;
}

const QUESTION_TYPE_LABELS: Record<SymbolicQuestionType, string> = {
    algebra: 'Algebra',
    derivative: 'Derivata',
    integral: 'Integral',
    limit: 'Gränsvärde',
    other: 'Symboliskt svar',
    series: 'Serie',
    trigonometry: 'Trigonometri',
};

export function SymbolicMathInput({ question, onAnswer }: SymbolicMathInputProps) {
    const answerConfig = question.answerConfig ?? {};
    const gradingConfig = question.gradingConfig ?? {
        exact: String(question.correctAnswer ?? ''),
    };
    const symbolicType = answerConfig.questionType ?? 'other';
    const placeholder = answerConfig.placeholder ?? 't.ex. (s+1)/(s^2+4), ln(x)+C eller lim_(x->0)';
    const ignoreConstant = answerConfig.ignoreConstant ?? gradingConfig.ignoreConstant ?? false;
    const showKeyboard = answerConfig.showKeyboard ?? true;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Symboliskt svar
                    </p>
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                        {QUESTION_TYPE_LABELS[symbolicType]}
                    </span>
                    {ignoreConstant && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Tillåter +C
                        </span>
                    )}
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Anpassad för universitetssvar som gränsvärden, integraler, derivator, överföringsfunktioner och karakteristiska ekvationer.
                </p>
            </div>

            <MathCASInput
                correctAnswer={gradingConfig.exact || String(question.correctAnswer ?? '')}
                questionId={question.id}
                topicId={question.topicId}
                ignoreConstant={ignoreConstant}
                questionType={symbolicType}
                showKeyboard={showKeyboard}
                placeholder={placeholder}
                onAnswer={onAnswer}
            />
        </div>
    );
}

export default SymbolicMathInput;
