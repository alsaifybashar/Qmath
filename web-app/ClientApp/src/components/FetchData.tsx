import React, { useEffect, useState } from 'react';
// import {  EditableMathField, MathField } from 'react-mathquill'
// import 'react-mathquill/mathquill.css';


// import { Card } from 'react-bootstrap';

// interface Forecast {
//     date: string;
//     temperatureC: number;
//     temperatureF: number;
//     summary?: string;
// };

interface Question {
    questionText: string;
    subQuestionText?: string[]; // Optional sub questions
}

const FetchData = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [latex, setLatex] = useState<string | undefined>();

    // Takes the place of componentDidMount()
    useEffect(() => {
        const populateQuestionData = async () => {
            const response = await fetch('questions');
            const data = await response.json();
            console.log(data);
            setQuestions(data);
            setLoading(false);
        }

        populateQuestionData()
    }, []);

    const submitMainQuestions = async (event: React.FormEvent<HTMLFormElement>) => {
        //submit to backend, return more questions
        event.preventDefault();
        const answers = await fetch("answers");
        const answersData = await answers.json();

        const subQuestions = await fetch("subquestions");
        const subQuestionsData = await subQuestions.json();


        console.log(subQuestionsData);
        setQuestions(prevQuestions => {
            return prevQuestions.map((question, index) => ({
                ...question,
                subQuestionText: subQuestionsData[index]?.subQuestionText || [] // Ensure each question has subQuestions array
            }));
        });
    }

    const renderQuestions = (questions: Question[]) => {
        return (
            // <Card>
            //     <Card.Body>
            <div className="outer">
                <div className="Card">
                    <form onSubmit={event => submitMainQuestions(event)}>

                                { questions.map((question, index) => 
                                        <div key={index}>
                                                <div className="mainQuestion">
                                                    <label>Question {index+1}. {question.questionText}</label>
                                                    <input type="text"></input>
                                                    {/* <div>
                                                        <EditableMathField
                                                            latex={latex}
                                                            onChange={(mathField: MathField) => {
                                                            setLatex(mathField.latex())
                                                            }}
                                                        />
                                                        <p>{latex}</p>
                                                    </div> */}
                                                </div>
                                                { question.subQuestionText && question.subQuestionText.map(SubQuestionText => 
                                                        <div className="subQuestion">
                                                            <label>{SubQuestionText}</label>
                                                            <input type="text"></input>
                                                        </div>
                                                    ) 
                                                }
                                        </div>
                                    )
                                }
                                <button type="submit">Rätta</button>
                            </form>
                    </div>
                </div>
            //     </Card.Body>
            // </Card>
        );
    }

        let contents = loading
        ? <p><em>Loading...</em></p>
        : renderQuestions(questions);

        return (
            <>
                {contents}

                <style>
                    {`

                        .outer {
                            display: flex;
                            justify-content: center; /* Horizontally center */
                            align-items: center;     /* Vertically center */
                            }
                        .Card {
                            width: 30%;             
                            display: flex;
                            align-items: center;    
                            border: 1px solid #aaa;  
                            background-color: #eee;
                            border-radius: 10px;
                            padding: 2%;
                        }
                        .mainQuestion {
                            display: flex;
                            flex-direction: column;
                            width: 100%;
                        }
                        .subQuestion {
                            color: red;
                            display: flex;
                            flex-direction: column;
                            width: 100%;
                            margin: 5px 0;
                            margin-left: 5%;
                        }
                    `}
                </style>
            </>
        );
}


export { FetchData };