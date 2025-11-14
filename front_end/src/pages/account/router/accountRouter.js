import React from "react";
import { Route, Navigate } from "react-router-dom";
import Step1Consent from "../Step1Consent";
import Step2IdVerify from "../Step2IdVerify";
import Step3Info from "../Step3Info";
import Step4Product from "../Step4Product";
import Step5Done from "../Step5Done";
import ProtectedRoute from "../component/ProtectedRoute";

export const accountElements = (

    <>
        < Route
            path="/account/open"
            element={
               <ProtectedRoute> 
                 < Navigate to="/account/open/step1" replace />
               </ProtectedRoute>
            }
        />
        < Route path="/account/open/step1" element={< Step1Consent />} />
        < Route path="/account/open/step2" element={< Step2IdVerify />} />
        < Route path="/account/open/step3" element={< Step3Info />} />
        < Route path="/account/open/step4" element={< Step4Product />} />
        < Route path="/account/open/step5" element={< Step5Done />} />
    </>
);

