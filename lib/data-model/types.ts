export type TopicStatus = 'locked' | 'unlocked' | 'in_progress' | 'mastered';

export interface StudentProfile {
    id: string;
    email: string;
    university_program?: string;
    enrollment_year?: number;
    created_at: Date;
    preferences: {
        daily_goal_minutes: number;
        theme: 'light' | 'dark' | 'system';
    };
}

export interface TopicNode {
    id: string;
    slug: string;
    title: string;
    description: string;
    parent_topic_id?: string;
    prerequisites: string[];
    base_difficulty: number; // 1-10 scale
}

export interface Question {
    id: string;
    topic_id: string;
    content_markdown: string;
    difficulty: number;
    type: 'multiple_choice' | 'numeric' | 'proof_step';
    options?: string[]; // for MC
    correct_answer: string;
    explanation_markdown: string;
    sub_questions?: Question[]; // Recursive structure for "Breakdown"
}

export interface AttemptEvent {
    id: string;
    user_id: string;
    question_id: string;
    timestamp: Date;
    is_correct: boolean;
    time_taken_ms: number;
    input_answer: string;
}
