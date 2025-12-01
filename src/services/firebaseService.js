// Function to add a new patient record
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // To get the current user ID

const db = getFirestore();
const auth = getAuth();

/**
 * Saves a new patient record to the Firestore 'patients' collection.
 * CRITICAL: The patient is linked to the currently logged-in clinic user.
 * * @param {Object} patientData - The data collected from the form (Name, DOB, Phone, etc.)
 * @returns {Promise<string>} The ID of the newly created patient document
 */
export async function addNewPatient(patientData) {
    // 1. Get the ID of the currently logged-in Clinic user (store.samdhu or behappy216)
    const currentUser = auth.currentUser;
    if (!currentUser) {
        // This is a safety check: a clinic must be logged in to add a patient.
        throw new Error("Authentication Error: No clinic user is currently logged in.");
    }

    const clinicId = currentUser.uid;

    // 2. Structure the data to be saved in the 'patients' collection
    const newPatientRecord = {
        ...patientData, // Takes all fields from the form (fullName, dateOfBirth, etc.)
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