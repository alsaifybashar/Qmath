export interface courseInformation {
    courseCode?: string;
    courseName?: string;
}

export interface Question {
    Topic: string;
    Description?:string;
    problemLatex: string;
}

export interface questionItem {
    id: string;
    question: Question;
}

export interface QuestionWithSub {
    questionText: string;
    subQuestionText?: string[]; // Optional sub questions
    // success: boolean;
}