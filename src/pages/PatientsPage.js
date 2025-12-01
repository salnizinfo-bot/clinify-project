// PatientsPage.js
import React, { useState } from 'react';
import NewPatientForm from '../components/patient/NewPatientForm'; 

function PatientsPage() {
    // State to manage whether the form is shown or hidden
    const [isFormVisible, setIsFormVisible] = useState(false); 

    return (
        <div className="patients-container">
            <h1>Patient Management Dashboard</h1>
            
            {/* Button to toggle the visibility of the form */}
            <button 
                onClick={() => setIsFormVisible(true)}
                disabled={isFormVisible} // Disable button when form is already open
                style={{ marginBottom: '20px', padding: '10px 15px' }}
            >
                + Add New Patient
            </button>

            {/* Display the form when isFormVisible is true */}
            {isFormVisible && (
                <div className="new-patient-section" style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <NewPatientForm 
                        onSuccess={() => {
                            // After successful submission, hide the form 
                            setIsFormVisible(false);
                            alert("Patient record saved successfully!");
                        }}
                    />
                    <button 
                        onClick={() => setIsFormVisible(false)} 
                        style={{ marginTop: '10px', backgroundColor: '#f44336', color: 'white' }}
                    >
                        Close Form
                    </button>
                </div>
            )}
            
            {/* The patient list would eventually go here */}
            <h2>Current Patients List</h2>
            <p> (List functionality to be built later.)</p>
        </div>
    );
}

export default PatientsPage;