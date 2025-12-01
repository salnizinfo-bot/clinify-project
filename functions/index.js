// Import GCF Gen 2 modules
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Firebase Admin SDK to verify ID tokens
admin.initializeApp();

// --- Supabase Configuration ---
// !! CRITICAL ACTION: Replace the placeholders below with your actual Supabase details !!
const SUPABASE_URL = 'https://lycsemjvxjovqdgwzpnx.supabase.co'; // <--- REPLACE THIS
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3NlbWp2eGpvdnFkZ3d6cG54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3ODg4MiwiZXhwIjoyMDc4OTU0ODgyfQ.vVoEP99TcVzyWEeFzpxGbrE0ldr1VmM7xtNKe8TiPRA'; // <--- REPLACE THIS (Service Role Key)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to extract and verify the user's email from the Firebase ID Token
async function getAuthenticatedUser(req) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        throw new Error('No token provided.');
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken.email;
    } catch (error) {
        console.error("Token verification failed:", error);
        throw new Error('Token invalid.');
    }
}

// Helper to handle CORS response
function handleCors(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.status(204).send('');
        return true;
    }
    return false;
}

// ==========================================================
// 1. getClinicConfig Cloud Function (GCF GEN 2 SYNTAX & FIXED LOGIC)
// ==========================================================
exports.getClinicConfig = onRequest({ 
    region: 'us-central1', 
    runtime: 'nodejs20'
}, async (req, res) => {
    
    if (handleCors(req, res)) return;

    let userEmail;
    try {
        userEmail = await getAuthenticatedUser(req);
    } catch (error) {
        return res.status(401).send({ status: 'error', message: `Auth Failed: ${error.message}` });
    }

    try {
        // Look up the user's clinic using the verified email
        const { data, error } = await supabase
            .from('clinics')
            .select('clinic_type')
            .eq('owner_email', userEmail) 
            .single();

        if (error && error.code !== 'PGRST116') { 
            console.error("Supabase config query error:", error);
            return res.status(500).send({ status: 'error', message: 'Database query failed.' });
        }

        if (data) {
            // Success: Return the found clinic type
            return res.status(200).send({ status: 'success', clinicType: data.clinic_type });
        } else {
            // No clinic found for this email, default to general
            return res.status(200).send({ status: 'success', clinicType: 'general', message: 'Clinic config not found, defaulting.' });
        }

    } catch (e) {
        console.error("getClinicConfig fatal error:", e);
        return res.status(500).send({ status: 'error', message: 'Internal server error.' });
    }
});


// ==========================================================
// 2. getAdminData Cloud Function (GCF GEN 2 SYNTAX & UPDATED LOGIC)
// ==========================================================
exports.getAdminData = onRequest({ 
    region: 'us-central1', 
    runtime: 'nodejs20'
}, async (req, res) => {
    
    if (handleCors(req, res)) return;

    let userEmail;
    try {
        userEmail = await getAuthenticatedUser(req);
    } catch (error) {
        return res.status(401).send({ status: 'error', message: `Auth Failed: ${error.message}` });
    }

    // Determine the clinic ID based on the authenticated email
    let clinicId;
    try {
        const { data: clinicData, error: clinicError } = await supabase
            .from('clinics')
            .select('reg_no')
            .eq('owner_email', userEmail)
            .single();

        if (clinicError && clinicError.code !== 'PGRST116') {
            console.error('Failed to find clinic ID for user:', userEmail, clinicError);
            return res.status(500).send({ status: 'error', message: 'Internal server error during clinic lookup.' });
        }

        if (!clinicData) {
             return res.status(200).send({ status: 'success', data: { totalPatients: 0, appointmentsToday: 0 } });
        }
        
        clinicId = clinicData.reg_no;

    } catch (e) {
        console.error("Clinic ID lookup fatal error:", e);
        return res.status(500).send({ status: 'error', message: 'Internal server error during clinic lookup.' });
    }

    // --- NEW LOGIC: Conditional action handling ---
    const action = req.body.action;

    if (action === 'get_dashboard_summary') {
        // Fetch patient count for the specific clinic ID
        const { count: totalPatients, error: countError } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId); 

        if (countError) {
            console.error("Supabase patient count query error:", countError);
            return res.status(500).send({ status: 'error', message: 'Database query failed for metrics.' });
        }
        
        return res.status(200).send({
            status: 'success',
            data: {
                totalPatients: totalPatients || 0,
                appointmentsToday: 0
            }
        });

    } else if (action === 'get_patient_list') {
        // Fetch the entire patient list for the clinic
        const { data: patients, error: patientListError } = await supabase
            .from('patients')
            // Only select necessary columns for the table view
            .select('patient_id, full_name, dob, phone_number, last_visit') 
            .eq('clinic_id', clinicId)
            .order('last_visit', { ascending: false });

        if (patientListError) {
            console.error("Supabase patient list query error:", patientListError);
            return res.status(500).send({ status: 'error', message: 'Database query failed for patient list.' });
        }

        return res.status(200).send({
            status: 'success',
            // Return the list of patients under the 'patients' key
            data: {
                patients: patients
            }
        });
    }

    // Default response if no action is specified
    return res.status(400).send({ status: 'error', message: 'Invalid or missing action parameter.' });
});