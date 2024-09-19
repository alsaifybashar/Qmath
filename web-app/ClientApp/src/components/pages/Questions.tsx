import { useEffect, useState, ChangeEvent, useRef} from 'react';
import {MathInput} from "../common/MathInput";
import {MathStatic} from "../common/MathStatic";
import {Overlay, OverlayTrigger, Button, Tooltip} from 'react-bootstrap';
import { MathKeyBoard } from "../common/MathKeyboard";
import { MathField } from 'react-mathquill';
import { useDatabase } from '../../contexts/DatabaseContext';
import {QuestionWithSub} from "../../interfaces"

// import { Card } from 'react-bootstrap';

const Questions = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [questions, setQuestions] = useState<QuestionWithSub[]>([]);
    const [visible, setVisible] = useState<boolean>(false);
    // const [latex, setLatex] = useState<string | undefined>();
    const [activeInputRef, setActiveInputRef] = useState<MathField | null>(null);
    const {GETQuestions} = useDatabase();

    // const [show, setShow] = useState(false);
    // const target = useRef(null);

    const mainQuestionKey: string = "main";
    const subQuestionKey: string = mainQuestionKey+"sub";

    const [formValues, setFormValues] = useState<{ [key: string]: string }>({});

    const handleChange = (mainIndex: number, manualValue: string, subIndex?: number) => {
        const value = manualValue; 
        console.log(manualValue);
        const key = subIndex!==undefined ? `${mainIndex}${subIndex}`:`${mainIndex}`;
        setFormValues(prev => ({
          ...prev,
          [key]: value,
        }));
      };

    // Takes the place of componentDidMount()
    useEffect(() => {
        const populateQuestionData = async () => {
            const response = await fetch(`questions/getQ`).then();
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
        const answers = await fetch("questions/getA");
        const answersData = await answers.json(); // TODO - maybe post answers instead and let backend compare and return true or false
        
        const subQuestions = await fetch("questions/getSQ");
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

    const renderQuestions = (questions: QuestionWithSub[]) => {

        const placement = "right";
        
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
                                                    <MathInput 
                                                        handleChange={handleChange} 
                                                        mainIndex={mainIndex} 
                                                        // onFocus={handleFocus}
                                                        setActiveInputRef={setActiveInputRef}
                                                    />
                                                </div>
                                                { question.subQuestionText && question.subQuestionText.map((SubQuestionText, subIndex) => 
                                                        <div className="subQuestion">
                                                            <label>{mainIndex+1}.{subIndex+1}. {SubQuestionText}</label>
                                                            <MathInput 
                                                                handleChange={handleChange} 
                                                                mainIndex={mainIndex} 
                                                                subIndex={subIndex} 
                                                                setActiveInputRef={setActiveInputRef}
                                                            />
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
                    <MathKeyBoard isVisible={visible} activeInputRef={activeInputRef}
                    />
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