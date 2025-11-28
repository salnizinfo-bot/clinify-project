// 1. Core Imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { createClient } = require('@supabase/supabase-js');

// Initialize Firebase Admin SDK for user authentication checks
admin.initializeApp();

// 2. Supabase Initialization (Keys inserted below)
// The Public Anon Key is safe to include here.
const SUPABASE_URL = 'https://lycsemjvxjovqdgwzpnx.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3NlbWp2eGpvdnFkZ3d6cG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzg4ODIsImV4cCI6MjA3ODk1NDg4Mn0.VLkfH9W68mcoQFVSG7HbinzVv-jeH1zcKw3l0vsaCQs'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Authentication Middleware (to verify Firebase Token from the client)
const authenticate = async (request, response, next) => {
    // Get the ID token from the request headers
    if (!request.headers.authorization || !request.headers.authorization.startsWith('Bearer ')) {
        console.error('No Firebase ID token was passed.');
        response.status(403).send('Unauthorized');
        return;
    }

    const idToken = request.headers.authorization.split('Bearer ')[1];

    try {
        // Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        request.user = decodedToken; // Attach user info to the request
        next(); // Proceed to the function logic
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        response.status(403).send('Unauthorized');
    }
};


// 4. Migrate the Code.gs logic into GCF functions (Example: get_admin_data)
// This is the first API endpoint, mirroring the old Apps Script function.
exports.getAdminData = functions.https.onRequest(async (request, response) => {
    // Set CORS headers for all requests (CRITICAL for client/server communication)
    response.set('Access-Control-Allow-Origin', 'https://clinify-saas-prod.web.app'); // Replace with your actual hosting URL
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (request.method === 'OPTIONS') {
        // Handle preflight request for CORS
        response.status(204).send('');
        return;
    }

    // Apply authentication middleware
    await new Promise((resolve, reject) => {
        // Resolve is called when middleware is complete (success or failure)
        authenticate(request, response, resolve); 
    });

    // Check if authentication failed inside the middleware
    if (response.statusCode === 403) return; 

    try {
        // The request is now authenticated (request.user contains user info)
        const userEmail = request.user.email; 
        console.log(`Authenticated request from: ${userEmail}`);
        
        // --- YOUR MIGRATED APPS SCRIPT LOGIC WILL GO HERE ---
        
        // We deploy this empty function first to verify the GCF/Auth connection
        // The logic here proves the user logged in via Firebase Auth can call the GCF function.
        response.status(200).json({ 
            status: 'success', 
            message: 'GCF is live and authenticated. Supabase connection ready. Next step: Migrate data logic.' 
        });


    } catch (error) {
        console.error("Function execution error:", error);
        response.status(500).json({ status: 'error', message: error.message });
    }
});