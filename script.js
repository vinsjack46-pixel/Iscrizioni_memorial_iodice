// script.js
const { createClient } = window.supabase;
const supabaseUrl = 'https://grfslnoczwwtpdzgodog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnNsbm9jend3dHBkemdvZG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTUwNDIsImV4cCI6MjA3NTA3MTA0Mn0.uVvFam7ylyyKiJHOCE4pBHGvAhskAC_a3KZO9klYggc';

// Creiamo il client con un nome univoco
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Lo rendiamo globale per gli altri script
window.supabaseClient = supabaseClient;

// Funzione di Login
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        alert('Login avvenuto con successo!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Errore login:', error.message);
        alert('Credenziali non valide o errore di rete.');
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

        alert('Registrazione completata! Controlla la tua email per confermare l\'account.');
        window.location.href = 'login.html';
    } catch (error) {
        alert("Errore registrazione: " + error.message);
    }
}

// Funzione di Logout (Accessibile globalmente)
async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    } catch (error) {
        console.error("Errore logout:", error.message);
    }
}

// Listener per i moduli Auth
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signIn(document.getElementById('email').value, document.getElementById('password').value);
        });
    }

    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signUp(
                document.getElementById('email').value, 
                document.getElementById('password').value, 
                document.getElementById('nomeSocieta').value, 
                document.getElementById('cfs').value
            );
        });
    }
});
