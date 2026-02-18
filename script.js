// script.js
const { createClient } = window.supabase;
const supabaseUrl = 'https://grfslnoczwwtpdzgodog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnNsbm9jend3dHBkemdvZG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTUwNDIsImV4cCI6MjA3NTA3MTA0Mn0.uVvFam7ylyyKiJHOCE4pBHGvAhskAC_a3KZO9klYggc';

// Inizializzazione globale
const supabaseClient = createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabaseClient; // La rendiamo disponibile per script2.js

// Funzione di Login
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        alert('Login avvenuto!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Errore login:', error.message);
        alert('Errore: ' + error.message);
    }
}

// Funzione di Registrazione
async function signUp(email, password, nomeSocieta, cfs) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            const { error: societaError } = await supabaseClient.from('societa').insert([{ 
                nome: nomeSocieta, 
                email: email, 
                cfs: cfs, 
                user_id: data.user.id 
            }]);
            if (societaError) throw societaError;
        }

        alert('Registrazione avvenuta! Verifica la tua email.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Errore registrazione:', error.message);
        alert(error.message);
    }
}

// Funzione di Logout (Accessibile globalmente)
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = "login.html";
    } catch (error) {
        console.error("Errore logout:", error.message);
    }
}
