/**
 * Symbolic Validator
 * 
 * Checks if student answers are mathematically equivalent to expected answers.
 * Uses basic algebraic simplification for now (SymPy integration planned).
 */

import type { ValidationRequest, ValidationResult } from './types';
import { evaluateSafeExpression } from '@/lib/math/safe-expression';

export class SymbolicValidator {
    /**
     * Check if student answer is equivalent to expected answer
     */
    async validate(request: ValidationRequest): Promise<ValidationResult> {
        const { studentAnswer, expectedAnswer, alternativeForms = [] } = request;

        try {
            // Normalize both expressions
            const normalizedStudent = this.normalize(studentAnswer);
            const normalizedExpected = this.normalize(expectedAnswer);

            // Direct match
            if (normalizedStudent === normalizedExpected) {
                return {
                    isEquivalent: true,
                    confidence: 1.0,
                    simplifiedStudent: normalizedStudent,
                    simplifiedExpected: normalizedExpected,
                };
            }

            // Check alternative forms
            for (const alt of alternativeForms) {
                const normalizedAlt = this.normalize(alt);
                if (normalizedStudent === normalizedAlt) {
                    return {
                        isEquivalent: true,
                        confidence: 0.95,
                        simplifiedStudent: normalizedStudent,
                        simplifiedExpected: normalizedExpected,
                    };
                }
            }

            // Try algebraic equivalence (basic implementation)
            const algebraicEquivalent = this.checkAlgebraicEquivalence(
                normalizedStudent,
                normalizedExpected
            );

            if (algebraicEquivalent) {
                return {
                    isEquivalent: true,
                    confidence: 0.9,
                    simplifiedStudent: normalizedStudent,
                    simplifiedExpected: normalizedExpected,
                };
            }

            // Try numerical check (evaluate at test points)
            const numericalEquivalent = await this.checkNumericalEquivalence(
                studentAnswer,
                expectedAnswer
            );

            if (numericalEquivalent) {
                return {
                    isEquivalent: true,
                    confidence: 0.8,
                    simplifiedStudent: normalizedStudent,
                    simplifiedExpected: normalizedExpected,
                    hint: 'Answer matches numerically but may differ in form',
                };
            }

            // Not equivalent - try to provide helpful feedback
            const errorAnalysis = this.analyzeError(studentAnswer, expectedAnswer);

            return {
                isEquivalent: false,
                confidence: 0.9,
                simplifiedStudent: normalizedStudent,
                simplifiedExpected: normalizedExpected,
                errorType: errorAnalysis.errorType,
                hint: errorAnalysis.hint,
            };

        } catch (error) {
            return {
                isEquivalent: false,
                confidence: 0,
                parseError: error instanceof Error ? error.message : 'Failed to parse expression',
            };
        }
    }

    /**
     * Normalize an expression for comparison
     */
    private normalize(expr: string): string {
        return expr
            .toLowerCase()
            .replace(/\s+/g, '')           // Remove whitespace
            .replace(/\*\*/g, '^')         // ** to ^
            .replace(/·|×/g, '*')          // Unicode multiply to *
            .replace(/−/g, '-')            // Unicode minus to -
            .replace(/÷/g, '/')            // Unicode divide to /
            .replace(/\(([^()]+)\)/g, '$1') // Remove unnecessary parentheses (simple cases)
            .trim();
    }

    /**
     * Check algebraic equivalence using basic rules
     */
    private checkAlgebraicEquivalence(student: string, expected: string): boolean {
        // Basic commutative check: a+b == b+a, a*b == b*a
        const studentTerms = this.extractTerms(student, '+');
        const expectedTerms = this.extractTerms(expected, '+');

        if (studentTerms.length === expectedTerms.length) {
            const sortedStudent = [...studentTerms].sort();
            const sortedExpected = [...expectedTerms].sort();

            if (sortedStudent.every((term, i) => term === sortedExpected[i])) {
                return true;
            }
        }

        // Check for multiplicative commutativity
        const studentFactors = this.extractTerms(student, '*');
        const expectedFactors = this.extractTerms(expected, '*');

        if (studentFactors.length === expectedFactors.length) {
            const sortedStudent = [...studentFactors].sort();
            const sortedExpected = [...expectedFactors].sort();

            if (sortedStudent.every((term, i) => term === sortedExpected[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract terms split by an operator
     */
    private extractTerms(expr: string, operator: string): string[] {
        // Simple term extraction (doesn't handle nested expressions well)
        return expr.split(operator).map(t => t.trim()).filter(t => t.length > 0);
    }

    /**
     * Check numerical equivalence at test points
     */
    private async checkNumericalEquivalence(student: string, expected: string): Promise<boolean> {
        const testPoints = [0, 1, 2, -1, 0.5, Math.PI];
        const tolerance = 1e-9;

        try {
            for (const x of testPoints) {
                const studentVal = this.evaluateAt(student, x);
                const expectedVal = this.evaluateAt(expected, x);

                if (studentVal === null || expectedVal === null) continue;
                if (Math.abs(studentVal - expectedVal) > tolerance) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Evaluate expression at a point (basic implementation)
     */
    private evaluateAt(expr: string, x: number): number | null {
        try {
            const normalized = expr.replace(/\*\*/g, '^').replace(/−/g, '-');
            const result = evaluateSafeExpression(normalized, { x });
            return typeof result === 'number' && Number.isFinite(result) ? result : null;
        } catch {
            return null;
        }
    }

    /**
     * Analyze why student answer differs from expected
     */
    private analyzeError(student: string, expected: string): { errorType?: string; hint?: string } {
        // Check for sign error
        if (this.normalize(student) === this.normalize('-' + expected) ||
            this.normalize('-' + student) === this.normalize(expected)) {
            return {
                errorType: 'sign_error',
                hint: 'Check your signs - your answer differs by a negative sign',
            };
        }

        // Check for missing constant
        if (expected.includes('+c') || expected.includes('+C')) {
            if (!student.includes('+c') && !student.includes('+C')) {
                return {
                    errorType: 'missing_constant',
                    hint: 'Don\'t forget the constant of integration (+C)',
                };
            }
        }

        // Check for factor of 2 error
        const studentNorm = this.normalize(student);
        const expectedNorm = this.normalize(expected);
        if (studentNorm === this.normalize('2*' + expected) ||
            this.normalize('2*' + student) === expectedNorm) {
            return {
                errorType: 'factor_error',
                hint: 'Check your coefficients - your answer may be off by a factor of 2',
            };
        }

        return {
            hint: 'Your answer doesn\'t match the expected result. Try simplifying your expression.',
        };
    }
}

// Export singleton instance
export const symbolicValidator = new SymbolicValidator();
