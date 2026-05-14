// import {courseInformation} from "../interfaces";
import React from "react";
import {useParams} from "react-router-dom";

// export const Documentation = ({courseCode="tdde41", courseName="Envariabelanalys"}: courseInformation) => {
export const Documentation = () => {

    const courseCode = useParams().coursecode;

    return (
        <>
            <div>
               Det här är dokumentationen för {courseCode}
            </div>
        </>
    );
}
