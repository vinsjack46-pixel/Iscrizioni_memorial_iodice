// ===================================
// CONFIGURAZIONE SUPABASE
// ===================================
const { createClient } = window.supabase;
const supabaseUrl = 'https://grfslnoczwwtpdzgodog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnNsbm9jend3dHBkemdvZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NTA0MiwiZXhwIjoyMDc1MDcxMDQyfQ.DbN-0V1itbz51afMxCtcGTnGyZ2oiOTJbn_zIT-mJYY'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================
// FUNZIONI DI VALIDAZIONE E UTILITY
// ===================================

/**
 * Funzione di validazione sintattica per Codice Fiscale (16 car. alfanumerici) 
 * o Partita IVA (11 cifre).
 * @param {string} cfs - Il Codice Fiscale o P.IVA da validare.
 * @returns {string} Il Codice Fiscale pulito e in maiuscolo.
 * @throws {Error} Se il formato non è valido.
 */
function validateCfsPiva(cfs) {
    const cleanedCfs = cfs.trim().toUpperCase();
    
    // Regex basilare: 16 alfanumerici (CF) O 11 cifre (PIVA)
    const regexCfsPiva = /^([A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]|[0-9]{11})$/i;

    if (!regexCfsPiva.test(cleanedCfs)) {
        throw new Error('Codice Fiscale o Partita IVA non validi. Controlla il formato (16 car. alfanumerici o 11 cifre).');
    }
    return cleanedCfs;
}

// ===================================
// FUNZIONI DI AUTENTICAZIONE E DATABASE
// ===================================

async function signUp(email, password, nomeSocieta, cfs) {
    try {
        // 1. Validazione e pulizia del campo CFS/PIVA
        const cleanedCfs = validateCfsPiva(cfs);

        // 2. Registrazione Utente in Auth (supabase.auth.users)
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        // Assicurati che l'utente sia stato creato per ottenere l'ID
        if (!authData.user) {
             throw new Error("Errore: Impossibile recuperare l'ID utente dopo la registrazione.");
        }
        
        // 3. Inserimento Società nella tabella 'societa'
        const { error: societaError } = await supabase.from('societa').insert([
            { 
                nome: nomeSocieta, 
                email: email, 
                cfs: cleanedCfs, // Usa il valore validato
                user_id: authData.user.id 
            }
        ]);
        if (societaError) throw societaError;

        alert('Registrazione avvenuta! Controlla la tua email per confermare l\'account.');
        window.location.href = '/login.html';
    } catch (error) {
        // La validazione o l'API lancerà un errore qui
        console.error('Errore di Registrazione:', error.message);
        alert('Errore: ' + error.message);
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        alert('Login avvenuto!');
        // Il fetch dei dati della società e atleti avverrà sulla pagina index.html (fetchSocietyNameOnLoad)
        window.location.href = '/index.html'; 
    } catch (error) {
        console.error('Errore login:', error.message);
        alert(error.message);
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        alert('Logout avvenuto!');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Errore logout:', error.message);
        alert(error.message);
    }
}

// ===================================
// FETCH DATI POST-LOGIN (per index.html)
// ===================================

async function fetchAthletes() {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) {
            // console.error("Utente non autenticato."); // Non loggare in produzione
            return;
        }

        // Recupera gli atleti
        const { data, error } = await supabase
            .from('athletes') 
            .select('*')
            .eq('user_id', user.data.user.id); 

        if (error) throw error;

        // Popola il frontend (presuppone un elemento <ul id="athletesList">)
        const athletesList = document.getElementById('athletesList'); 
        if (athletesList) {
            athletesList.innerHTML = data.map(athlete => `<li>${athlete.nome}</li>`).join('');
        }
    } catch (error) {
        console.error("Errore nel recupero degli atleti:", error.message);
    }
}

async function fetchSocietyNameOnLoad() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) {
        const { data: societyData, error: societyError } = await supabase
            .from('societa')
            .select('nome')
            .eq('user_id', userData.user.id)
            .single();

        if (societyError && societyError.code !== 'PGRST116') { // PGRST116 è 'No Rows Found' - lo ignoriamo qui
            console.error("Errore nel recupero del nome della società:", societyError.message);
        } else if (societyData) {
            const societyNameDisplay = document.getElementById('societyNameDisplay');
            if (societyNameDisplay) {
                societyNameDisplay.textContent = societyData.nome;
            }
            
            // Avvia il recupero di altri dati dopo aver verificato l'utente
            await fetchAthletes();
        }
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

// Event Listener per la Registrazione (SOLUZIONE AL TUO PROBLEMA)
const registrazioneForm = document.getElementById('registrazioneForm');
if (registrazioneForm) {
    registrazioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeSocieta = document.getElementById('nomeSocieta').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // ⭐️ CORREZIONE: Recupero e passaggio di CFS/PIVA
        const cfs = document.getElementById('cfs').value; 
        
        await signUp(email, password, nomeSocieta, cfs);
    });
}

// Event Listener per il Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await signIn(email, password);
    });
}

// Event Listener per il Logout (se hai un bottone con ID 'logoutButton')
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', signOut);
}

// ⚠️ Esecuzione del fetch dei dati all'apertura della pagina
document.addEventListener('DOMContentLoaded', fetchSocietyNameOnLoad);
