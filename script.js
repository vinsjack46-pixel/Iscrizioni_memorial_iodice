// script.js
const { createClient } = window.supabase;
const supabaseUrl = 'https://grfslnoczwwtpdzgodog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnNsbm9jend3dHBkemdvZG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTUwNDIsImV4cCI6MjA3NTA3MTA0Mn0.uVvFam7ylyyKiJHOCE4pBHGvAhskAC_a3KZO9klYggc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funzioni di Autenticazione
async function signUp(email, password, nomeSocieta, cfs) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: societaError } = await supabase.from('societa').insert([{ nome: nomeSocieta, email: email, cfs: cfs, user_id: data.user.id }]);
        if (societaError) throw societaError;
        alert('Registrazione avvenuta! Controlla la tua posta e verifica la tua email');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Errore:', error.message);
        alert(error.message);
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const user = await supabase.auth.getUser();
        if (user.data?.user?.id) {
            const { data: societyData, error: societyError } = await supabase
                .from('societa')
                .select('nome')
                .eq('user_id', user.data.user.id)
                .single();
            if (!societyError && societyData) {
                const societyDisplay = document.getElementById('societyNameDisplay');
                if (societyDisplay) societyDisplay.textContent = societyData.nome;
                const societyInput = document.getElementById('society');
                if (societyInput) societyInput.value = societyData.nome;
                await fetchAthletes();
            }
        }
        alert('Login avvenuto!');
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Errore login:', error.message);
        alert(error.message);
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = "login.html";
    } catch (error) {
        console.error("Errore logout:", error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('registrazioneForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await signUp(document.getElementById('email').value.trim(), document.getElementById('password').value, document.getElementById('nomeSocieta').value, document.getElementById('cfs').value);
        });
    }

    const logForm = document.getElementById('loginForm');
    if (logForm) {
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await signIn(document.getElementById('email').value, document.getElementById('password').value);
        });
    }
});

async function fetchAthletes() {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) return;
        const { data, error } = await supabase.from('atleti').select('*').eq('user_id', user.data.user.id);
        if (error) throw error;
        const list = document.getElementById('athleteList');
        if (list && data) {
            // Qui la logica per popolare la tabella
        }
    } catch (error) {
        console.error("Errore recupero atleti:", error.message);
    }
}

async function fetchSocietyNameOnLoad() {
    const user = await supabase.auth.getUser();
    if (user.data?.user?.id) {
        const { data: societyData } = await supabase.from('societa').select('nome').eq('user_id', user.data.user.id).single();
        if (societyData) {
            const display = document.getElementById('societyNameDisplay');
            if (display) display.textContent = societyData.nome;
            const input = document.getElementById('society');
            if (input) input.value = societyData.nome;
            if (typeof fetchAthletes === 'function') await fetchAthletes();
        }
    }
}
fetchSocietyNameOnLoad();
