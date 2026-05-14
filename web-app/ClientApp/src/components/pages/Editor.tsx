import React, {useRef, useState, useEffect} from 'react';
import {Form, Button, Card, InputGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { useParams, useNavigate } from "react-router-dom";
import { MathInput } from '../common/MathInput';
import { MathField } from 'react-mathquill';
import CloseButton from 'react-bootstrap/CloseButton';
import { v4 as uuidv4 } from 'uuid';
// import Swal, { SweetAlertIcon } from 'sweetalert2';
// import {Room, Question, questionItem} from "../../interfaces";
import { useDatabase } from '../../contexts/DatabaseContext';

import {Question, questionItem} from "../../interfaces";
// import Loading from '../common/Loading';

interface optionalProps {
  editMode?: boolean;
}

// Custom error to validate forms
class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export default function Editor({editMode}: optionalProps) {

    const [questions, setQuestions] = useState<questionItem[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    // const [editRoom, setEditRoom] = useState<Room | null>(null);

    const nameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);

    const alertTimer = 2500; // 2500 ms = 2.5s
    const [permission, setPermission] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<boolean>(false);

    const [activeInputRef, setActiveInputRef] = useState<MathField | null>(null);

    const currentUser = "test";
    const redirect = useNavigate();

    const { courseCode: courseCode } = useParams<{ courseCode: string }>();

    // const makeAlert = (iconString: SweetAlertIcon, titleString: string, hasConfirm: boolean, time: number) => {
    //     Swal.fire({
    //         icon: iconString,
    //         title: titleString,
    //         showConfirmButton: hasConfirm,
    //         timer: time
    //       });
    // }

    // Adds new questions or replaces one based on updateId
    const addToList = (newQuestion: Question, updateId?: string) => {
        /*         console.log(updateId);
                console.log(newQuestion); */
        if(updateId){ 
            setQuestions((prev) => prev.map(item =>
                    item.id === updateId ?
                        { id: item.id, question: newQuestion}
                        :
                        item
                )
            );
        }else {
            const newItem = {id: uuidv4(), question: newQuestion};
            setQuestions([...questions, newItem]);
        }
        console.log(questions);
    };

    const deleteItem = (deleteId: string) => {
        const newList = questions.filter(item => deleteId !== item.id); // make new filtered list, except for deleteId
        setQuestions(newList);
    }

    const clearForm = () => {
        if(nameRef.current) nameRef.current.value = "";
        if(descriptionRef.current) descriptionRef.current.value = "";
        if(imageRef.current) imageRef.current.value = "";
        // setQuestions([]);
        setUploadedFile(null);
    }

    const validUploadExtensions = ["/image/jpeg", "image/png", "image/jpeg", "image/webp"];

    const handleFileInput = (event: React.FocusEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if(validUploadExtensions.includes(file.type)){
                setUploadedFile(file);
            } else {
                setUploadError(true);
                event.target.value = "";
            }
        } else{
            setUploadedFile(null);
        }
        console.log(uploadedFile);
    }

    // Return error text if any form element is non-populated.
    const checkForms = (): string | null => {
        if(nameRef.current && nameRef.current.value === "") return "No topic chosen for the question.";
        // else if(descriptionRef.current && descriptionRef.current.value === "") return "No description for the room!";
        // else if(!uploadedFile && !editMode) return "No image uploaded for the room!";
        // else if(questions.length===0) return "No questions added!";
        return null;
    }

    const submitToDb =  async (/*event: React.FormEvent<HTMLFormElement>*/) => {
        try{
            const errorMsg = checkForms();
            if(errorMsg) throw new ValidationError(errorMsg);

            // const indexedQuestions = questions.map(({ id, question }) => ({
            //     ...question
            // }))as Question[];

            clearForm();
        } catch (error){
            if(error instanceof ValidationError){
                console.error("Validation Error: ", error);
                // makeAlert("error", error.message, false, alertTimer);
            } else{
                console.error("Something went wrong.\n", error);
                // makeAlert("error", "Oops! Something unexpected happened.", false, alertTimer);
            }
        }
    }

    const loadContent = () => {
        return (
            <>
                    <h2 className="text-center mb-4">Editor</h2>
                    {questions.map((question, index) => 
                    
                        <Card>
                            <Card.Body>
                                <CloseButton onClick={() => deleteItem(question.id)}/>
                                <Form onSubmit={submitToDb}>
                                    <p>Question {index+1}</p>
                                    <InputGroup id="createRoomName" className="mb-3">
                                            <InputGroup.Text>Topic</InputGroup.Text>
                                            <Form.Control ref={nameRef} type="text" placeholder="Enter the topic for the question"/>
                                    </InputGroup>
                                    <InputGroup>
                                        <InputGroup.Text>Description*</InputGroup.Text>
                                        <Form.Control ref={descriptionRef} as="textarea" aria-label="With textarea" placeholder="Optional description"/>
                                    </InputGroup>
                                    <Form.Group controlId="formFile" className="mb-3">
                                        <Form.Label>Upload images</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept='.jpg,.jpeg,.png,.webp'
                                                ref={imageRef}
                                                onBlur={(event: React.FocusEvent<HTMLInputElement>) =>{
                                                    handleFileInput(event);
                                                    if(uploadError) setUploadError(false);
                                                }}
                                                />
                                            {uploadError && <div style={{color: "red"}}>Unsupported file format. Try another.</div>}
                                        </Form.Group>
                                    <Form.Group className="mb-3">
                                        {/* populate from list updated by onlick function of button with questionPopupEdit. Show list of questions here */}
                                        <ul className="list-group">
                                        </ul>
                                        <p>Enter Problem</p>
                                        <MathInput setActiveInputRef={setActiveInputRef}></MathInput>
                                    </Form.Group>
                                    { currentUser ?
                                        <>
                                            <></>
                                        </>
                                        :
                                        <>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip id="createroom-login-tooltip">You need to login!</Tooltip>
                                                }
                                                placement="right"
                                                >
                                                <span className="d-inline-block">
                                                    <Button disabled style={{ pointerEvents: 'none' }}>
                                                        Create Room
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                        </>
                                    }
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                    <Form.Label>Add another question</Form.Label>
                    {/* TODO - Fixa så frågor läggs till i array rätt */}
                    <Button 
                        onClick={() => addToList(
                            {
                                Topic: "",
                                problemLatex:""
                            } as Question)}
                    >+</Button>
                    {/* <Button onClick={submitRoomToDb} id="uploadQuestionsButton">Upload question(s)</Button> */}
                    <div className="button-container">
                    <div className="button-wrapper">
                        <Button onClick={submitToDb} className="bottom-button">Upload question(s)</Button>
                    </div>
    </div>
            <style>
                {`
                    .button-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end; /* Align items to the bottom */
                        align-items: center; /* Center items horizontally */
                    }

                    .button-wrapper {
                        padding-bottom: 10px; /* Space between the button and the bottom of the container */
                    }

                    .bottom-button {
                        padding: 10px 10px; /* Adjust padding for button size */
                        background-color: #007BFF; /* Button color */
                        color: white; /* Text color */
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }

                    .bottom-button:hover {
                        background-color: #0056b3; /* Button color on hover */
                    }
                `}
            </style>
        </>
        );
    }

    return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div style={{width:"40%", height:"50%"}}>
            { !isLoading ? (
                permission ?
                    <>
                        {loadContent()}
                    </>
                    :
                    <Card style={{backgroundColor: "rgb(0,0,0,0.7)"}}>
                        <h4 style={{color: "white"}}>You do not have permission to view this page.</h4>
                    </Card>
                )
                :
                <p>Loading...</p>
            }
                    </div>
        </div>
    );
}