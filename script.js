const { createClient } = window.supabase;
const supabaseUrl = 'https://grfslnoczwwtpdzgodog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnNsbm9jend3dHBkemdvZG9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NTA0MiwiZXhwIjoyMDc1MDcxMDQyfQ.DbN-0V1itbz51afMxCtcGTnGyZ2oiOTJbn_zIT-mJYY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funzioni di Autenticazione
async function signUp(email, password, nomeSocieta, cfs) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const { error: societaError } = await supabase.from('societa').insert([{ nome: nomeSocieta, email: email, cfs: cfs, user_id: data.user.id }]);
        if (societaError) throw societaError;

        alert('Registrazione avvenuta!');
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

        // Fetch and display society name
        const user = await supabase.auth.getUser();
        if (user.data?.user?.id) {
            const { data: societyData, error: societyError } = await supabase
                .from('societa')
                .select('nome')
                .eq('user_id', user.data.user.id)
                .single();

            if (societyError) {
                console.error("Errore nel recupero del nome della società:", societyError.message);
            } else if (societyData) {
                // Esegui questo codice solo quando il DOM è pronto
                document.addEventListener('DOMContentLoaded', () => {
                    const societyNameDisplay = document.getElementById('societyNameDisplay');
                    if (societyNameDisplay) {
                        societyNameDisplay.textContent = societyData.nome;
                    }

                    // Set the society name in the form as well
                    const societyInput = document.getElementById('society');
                    if (societyInput) {
                        societyInput.value = societyData.nome;
                    }
                });
                // Recupera e visualizza gli atleti dopo il login
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

// Event Listener per la Registrazione
const registrazioneForm = document.getElementById('registrazioneForm');
if (registrazioneForm) {
    registrazioneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeSocieta = document.getElementById('nomeSocieta').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const cfs = documlementById('cfs').value
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
        await signIn(email, password);ent.getE
    });
}

// Event Listener per il Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.href = "login.html"; // Reindirizza alla pagina di login
    } catch (error) {
        console.error("Errore durante il logout:", error.message);
    }
}
async function fetchAthletes() {
    try {
        const user = await supabase.auth.getUser();
        if (!user.data?.user?.id) {
            console.error("Utente non autenticato.");
            return;
        }

        // Recupera gli atleti associati all'utente loggato
        const { data, error } = await supabase
            .from('athletes') // Assicurati che il nome della tabella sia corretto
            .select('*')
            .eq('user_id', user.data.user.id); 

        if (error) {
            throw error;
        }

        console.log("Atleti recuperati:", data);

        // Popola il frontend con i dati degli atleti (se necessario)
        const athletesList = document.getElementById('athletesList'); 
        if (athletesList) {
            athletesList.innerHTML = data.map(athlete => `<li>${athlete.nome}</li>`).join('');
        }

    } catch (error) {
        console.error("Errore nel recupero degli atleti:", error.message);
    }
}

// Fetch society name on page load if user is logged in
async function fetchSocietyNameOnLoad() {
    const user = await supabase.auth.getUser();
    if (user.data?.user?.id) {
        const { data: societyData, error: societyError } = await supabase
            .from('societa')
            .select('nome')
            .eq('user_id', user.data.user.id)
            .single();

        if (societyError) {
            console.error("Errore nel recupero del nome della società:", societyError.message);
        } else if (societyData) {
            document.getElementById('societyNameDisplay').textContent = societyData.nome;
            // Set the society name in the form as well
            const societyInput = document.getElementById('society');
            if (societyInput) {
                societyInput.value = societyData.nome;
            }
            // Recupera gli atleti al caricamento se l'utente è loggato
            await fetchAthletes();
        }
    }
}

fetchSocietyNameOnLoad(); 
