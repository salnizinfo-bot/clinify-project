// NewPatientForm.js
import React, { useState } from 'react';
// Correct import path for our firebaseService.js file:
import { addNewPatient } from '../../services/firebaseService'; 

function NewPatientForm({ onSuccess }) {
    // State to hold form data
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        email: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handler for input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation check for required fields
        if (!formData.fullName || !formData.dateOfBirth || !formData.phoneNumber || !formData.gender) {
            setError("Please fill in all required fields (Name, DOB, Gender, Phone).");
            setLoading(false);
            return;
        }

        try {
            // Call the shared function to save the patient data to Firebase
            await addNewPatient(formData);
            
            // Success feedback and reset form
            setFormData({ fullName: '', dateOfBirth: '', gender: '', phoneNumber: '', email: '', address: '' });
            if (onSuccess) onSuccess(); // Signal success to the parent page (to hide the form)
            
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to add patient due to a server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="patient-form">
            <h3>Patient Details Form</h3>
            
            {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>Error: {error}</div>}

            <label htmlFor="fullName">Full Name *</label>
            <input 
                type="text" 
                id="fullName" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
            />

            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input 
                type="date" 
                id="dateOfBirth" 
                name="dateOfBirth" 
                value={formData.dateOfBirth} 
                onChange={handleChange} 
                required 
            />

            <label htmlFor="gender">Gender *</label>
            <select 
                id="gender" 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange} 
                required
            >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>

            <label htmlFor="phoneNumber">Phone Number *</label>
            <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                required 
            />

            <label htmlFor="email">Email Address</label>
            <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
            />

            <label htmlFor="address">Address</label>
            <textarea 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
            ></textarea>

            <button type="submit" disabled={loading} style={{ marginTop: '20px', padding: '10px 15px' }}>
                {loading ? 'Adding Patient...' : 'Save Patient Record'}
            </button>
        </form>
    );
}

export default NewPatientForm;