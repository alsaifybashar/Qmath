import { redirect } from 'next/navigation';

/**
 * The question-view prototype has been absorbed into the unified /study
 * experience (fading steps, assistance ladder, scratchpad, command bar).
 * See components/study/* — this route only redirects now.
 */
export default function QuestionViewRedirect() {
    redirect('/study');
}
