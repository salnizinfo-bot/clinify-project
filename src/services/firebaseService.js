// Function to add a new patient record
// CRITICAL FIX: We move initialization (getFirestore, getAuth) inside the function 
// to prevent "client is offline" errors from trying to access Firebase too early.

import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 

/**
 * Saves a new patient record to the Firestore 'patients' collection.
 * @param {Object} patientData - The data collected from the form (Name, DOB, Phone, etc.)
 * @returns {Promise<string>} The ID of the newly created patient document
 */
export async function addNewPatient(patientData) {
    
    // Initialize services ONLY when the function is called, ensuring Firebase is ready.
    const db = getFirestore();
    const auth = getAuth();
    
    // 1. Get the ID of the currently logged-in Clinic user (store.samdhu or behappy216)
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Authentication Error: No clinic user is currently logged in.");
    }

    const clinicId = currentUser.uid;

    // 2. Structure the data to be saved in the 'patients' collection
    const newPatientRecord = {
        ...patientData, 
        clinicId: clinicId, // REQUIRED LINK: Ties the patient record to the clinic
        createdAt: new Date(),
    };

    try {
        // 3. Save the document to the 'patients' collection in Firestore
        const docRef = await addDoc(collection(db, "patients"), newPatientRecord);
        console.log("Patient record successfully written with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Failed to save patient record. Check Firebase connection and permissions.");
    }
}