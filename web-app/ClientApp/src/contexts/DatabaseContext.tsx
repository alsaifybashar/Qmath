import { createContext, useContext, ReactNode} from "react";
// import { doc, getDoc, collection, getDocs, setDoc, query, where, deleteDoc, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore';
// import { getDownloadURL, ref, uploadBytes, deleteObject} from "firebase/storage";
import { v4  } from 'uuid';
import { Question, QuestionWithSub } from "../interfaces";

export interface DatabaseContextTypes {
    GETQuestions: (request:string) => Promise<QuestionWithSub[]>;
  }

  interface ProviderProps{
    children: ReactNode;
  }

const DatabaseContext = createContext<DatabaseContextTypes | undefined>(undefined);

// Note: Functions do not use try-catch for errors, handle errors when calling instead
export const DatabaseProvider = ({ children }: ProviderProps) => {


    const checkValidUrl = async(url: string): Promise<boolean> => {
        try {
            const resp = await fetch (url, {method: "head"});
            return resp.ok;
        } catch( error ){
            return false;
        }
    }

    const GETQuestions = async (request: string): Promise<QuestionWithSub[]> => {
            const response = await fetch(request);
            const data = await response.json();
            return data;
    }

    const POSTQuestions = async (questions: Question[]) => {
        
    }

    return (
        <>
            <DatabaseContext.Provider value={{
                    GETQuestions

                }}>
                {/* children is a special variable in react used to pass child elements. So to wrap the rest of the page */}
                {children}
            </DatabaseContext.Provider>
        </>

    );
};

export const useDatabase = (): DatabaseContextTypes => {
    const context = useContext(DatabaseContext);
    if(!context) throw new Error("useDatabase must be in a provider.");
    return context;
}