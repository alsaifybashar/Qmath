import { useEffect, useState, ChangeEvent} from 'react';
import {MathInput} from "./MathInput";
import {MathStatic} from "./MathStatic";
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
    // success: boolean;
}

const Questions = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    // const [latex, setLatex] = useState<string | undefined>();

    const mainQuestionKey: string = "main";
    const subQuestionKey: string = mainQuestionKey+"sub";

    const [formValues, setFormValues] = useState<{ [key: string]: string }>({});

    const handleChange = (mainIndex: number, manualValue: string, subIndex?: number) => {
        const value = manualValue; 
        const key = subIndex!==undefined ? `${mainIndex}${subIndex}`:`${mainIndex}`;
        setFormValues(prev => ({
          ...prev,
          [key]: value,
        }));
      };
    

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
        // TODO - Maybe add a success status to indicate if question has been completed to display success message {{question: text, success: true}, {question: text, success: false}, ...}
        event.preventDefault();
        const answers = await fetch("answers");
        const answersData = await answers.json(); // TODO - maybe post answers instead and let backend compare and return true or false
        
        const subQuestions = await fetch("subquestions");
        const subQuestionsData = await subQuestions.json();

        for (let index = 0; index < answersData.length; index++) {
            const correctAnswer = answersData[index]["answersText"];
            console.log("correctAnswer"+index, correctAnswer);
            const userAnswer = formValues[`${index}`];
            console.log("userAnswer: ",userAnswer);
            subQuestionsData[index] = correctAnswer!==userAnswer ? subQuestionsData[index]:undefined;
        }

        console.log(subQuestionsData);
        setQuestions(prevQuestions => {
            return prevQuestions.map((question, index) => ({
                ...question,
                subQuestionText: subQuestionsData[index]?.subQuestionText || []
            }));
        });
    }

    const submitSubQuestions = async(mainIndex: number) => {
        const nr_subqeustions = questions[mainIndex]["subQuestionText"]?.length;
        // const answers = await fetch("subQuestionAnswers"); // Make this a POST requst and send mainIndex for which main question
        if(nr_subqeustions){
            for (let index = 0; index < nr_subqeustions; index++) {
                const userAnswer = formValues[`${mainIndex}${index}`];
                // compare real answer with user answer here
            }
        } else {
            console.error("Something went wrong, this questions has no subquestions.");
        }
    }

    const renderQuestions = (questions: Question[]) => {
        return (
            // <Card>
            //     <Card.Body>
            <div className="outer">
                <div className="Card">
                    <form onSubmit={event => submitMainQuestions(event)}>

                                { questions.map((question, mainIndex) => 
                                    
                                        <div key={mainQuestionKey+mainIndex}>
                                            
                                                <div className="mainQuestion">
                                                    {/* <label>Question {mainIndex+1}. {question.questionText}</label> */}
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap'  }}>Question {mainIndex + 1}.  </p>
                                                        <MathStatic latex={`${question.questionText}`} />
                                                    </div>
                                                    {/* <input 
                                                        type="text" 
                                                        name={`${mainIndex}`}
                                                        id={`${mainIndex}`}
                                                        value={formValues[mainIndex] || ''}
                                                        onChange={(e) => handleChange(e, mainIndex)}
                                                    ></input> */}
                                                    <MathInput mainIndex={mainIndex} handleChange={handleChange}/>
                                                </div>
                                                { question.subQuestionText && question.subQuestionText.map((SubQuestionText, subIndex) => 
                                                        <div className="subQuestion">
                                                            <label>{mainIndex+1}.{subIndex+1}. {SubQuestionText}</label>
                                                            {/* <input 
                                                                type="text" 
                                                                name={`${mainIndex}${subIndex}`}
                                                                id={`${mainIndex}${subIndex}`}
                                                                value={formValues[`${mainIndex}${subIndex}`] || ''}
                                                                onChange={(e) => handleChange(e, mainIndex, subIndex)}
                                                            ></input> */}
                                                            <MathInput mainIndex={mainIndex} handleChange={handleChange} subIndex={subIndex}/>
                                                        </div>
                                                    ) 
                                                }
                                                { question.subQuestionText && question.subQuestionText.length!==0 && <button onClick={() => {submitSubQuestions(mainIndex); console.log("arr: ",question.subQuestionText)}}>Rätta delfrågor</button>}
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


export { Questions };