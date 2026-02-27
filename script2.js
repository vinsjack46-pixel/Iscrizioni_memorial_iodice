const sb = window.supabaseClient;
let currentSocietyId = null;

// --- 1. LIMITI RIGIDI ---
const LIMITI = {
    "Kumite": 643,
    "Kata": 145,
    "ParaKarate": 50,
    "KIDS": 225 // Somma di tutte le specialità KIDS
};

// --- 2. LOGICA CLASSI, CINTURE E BLOCCO DATE ---
function updateSpecialtyOptionsBasedOnBirthdate() {
    const birthInput = document.getElementById("birthdate");
    if (!birthInput || !birthInput.value) return;

    const year = new Date(birthInput.value).getFullYear();

    // --- BLOCCO LIMITE ANNI (COPIALO COSÌ) ---
    if (year < 2010 || year > 2021) {
        alert("Attenzione: L'anno di nascita (" + year + ") non è ammesso. Range consentito: 2010-2021.");
        birthInput.value = ""; 
        return;
    }

    const clSel = document.getElementById("classe");
    const spSel = document.getElementById("specialty");
    const beltSel = document.getElementById("belt");
    let classe = "";
    
    // Suddivisione KIDS U6 e U8 (Seconda Logica Potenziata)
    if (year >= 2020 && year <= 2021) classe = "KIDS U6";
    else if (year >= 2018 && year <= 2019) classe = "KIDS U8";
    else if (year >= 2016 && year <= 2017) classe = "Fanciulli";
    else if (year >= 2014 && year <= 2015) classe = "Ragazzi";
    else if (year >= 2012 && year <= 2013) classe = "Esordienti";
    else if (year >= 2010 && year <= 2011) classe = "Cadetti";
    else classe = "Seniores/Master";

    clSel.innerHTML = `<option value="${classe}">${classe}</option>`;
    
    // Gestione Cinture con Accorpamenti (Nessuna opzione vuota)
    let belts = [];
    if (classe.includes("KIDS")) {
        belts = ["Bianca", "Bianca/Gialla", "Gialla", "Gialla/Arancio"];
    } else {
        belts = ["Bianca/Gialla", "Gialla/Arancio", "Arancio/Verde", "Verde/Blu", "Blu/Marrone", "Marrone/Nera"];
    }
    beltSel.innerHTML = belts.map(b => `<option value="${b}">${b}</option>`).join('');

    // Logica Specialità per Classe
    if (classe.includes("KIDS")) {
        spSel.innerHTML = `
            <option value="Percorso-Kata">Percorso-Kata</option>
            <option value="Percorso-Palloncino">Percorso-Palloncino</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else if (classe === "Fanciulli") {
        spSel.innerHTML = `
            <option value="Kata">Kata</option>
            <option value="Palloncino">Palloncino</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else {
        spSel.innerHTML = `
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="ParaKarate">ParaKarate</option>`;
    }
    toggleWeightCategory();
}

// --- 3. GESTIONE PESI (Obbligatori per Kumite/Para) ---
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const classe = document.getElementById("classe")?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightField = document.getElementById("weightCategory");

    weightField.innerHTML = ''; 
    weightField.disabled = true;

    if (specialty === "Kumite") {
        weightField.disabled = false;
        let weights = [];
        if (classe === "Esordienti") {
            weights = (gender === "Maschio") ? ["-40", "-45", "-50", "-55", "+55"] : ["-42", "-47", "-52", "+52"];
        } else if (classe === "Cadetti") {
            weights = (gender === "Maschio") ? ["-52", "-57", "-63", "-70", "+70"] : ["-47", "-54", "-61", "+61"];
        } else {
            weights = ["Open"];
        }
        weights.forEach(w => weightField.innerHTML += `<option value="${w}">${w} kg</option>`);
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K10", "K21", "K22", "K30"].forEach(k => weightField.innerHTML += `<option value="${k}">${k}</option>`);
    } else {
        // Valore di default "N/A" per specialità senza peso
        weightField.innerHTML = `<option value="-">-</option>`;
    }
}

// --- 4. CONTEGGI E BLOCCO ISCRIZIONI ---
async function updateAllCounters() {
    const { data: atleti } = await sb.from('atleti').select('specialty');
    
    const counts = {
        kumite: atleti.filter(a => a.specialty === 'Kumite').length,
        kata: atleti.filter(a => a.specialty === 'Kata').length,
        para: atleti.filter(a => a.specialty === 'ParaKarate').length,
        kids: atleti.filter(a => ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(a.specialty)).length
    };

    document.getElementById('kumiteAthleteCountDisplay').textContent = `${LIMITI.Kumite - counts.kumite} / ${LIMITI.Kumite}`;
    document.getElementById('kataAthleteCountDisplay').textContent = `${LIMITI.Kata - counts.kata} / ${LIMITI.Kata}`;
    document.getElementById('ParaKarateAthleteCountDisplay').textContent = `${LIMITI.ParaKarate - counts.para} / ${LIMITI.ParaKarate}`;
    document.getElementById('KIDSAthleteCountDisplay').textContent = `${LIMITI.KIDS - counts.kids} / ${LIMITI.KIDS}`;
    
    return counts;
}

// --- 5. AGGIUNTA ATLETA (Validazione e Salvataggio) ---
async function addAthlete(event) {
    event.preventDefault();
    if (!currentSocietyId) return alert("Errore: Società non identificata.");

    const spec = document.getElementById('specialty').value;
    const counts = await updateAllCounters();
    
    // Controllo Limiti: Se superato, blocca l'invio
    let limitReached = false;
    if (spec === "Kumite" && counts.kumite >= LIMITI.Kumite) limitReached = true;
    else if (spec === "Kata" && counts.kata >= LIMITI.Kata) limitReached = true;
    else if (spec === "ParaKarate" && counts.para >= LIMITI.ParaKarate) limitReached = true;
    else if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(spec) && counts.kids >= LIMITI.KIDS) limitReached = true;

    if (limitReached) {
        alert("ATTENZIONE: Posti esauriti per questa specialità!");
        return;
    }

    const athleteData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        birthdate: document.getElementById('birthdate').value,
        belt: document.getElementById('belt').value,
        classe: document.getElementById('classe').value,
        specialty: spec,
        weight_category: document.getElementById('weightCategory').value,
        society_id: currentSocietyId
    };

    const { error } = await sb.from('atleti').insert([athleteData]);
    if (error) alert("Errore Supabase: " + error.message);
    else {
        alert("Atleta registrato correttamente!");
        document.getElementById('athleteForm').reset();
        fetchAthletes();
    }
}

// --- 6. VISUALIZZAZIONE TABELLA COMPLETA ---
async function fetchAthletes() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', user.id).single();
    if (society) {
        currentSocietyId = society.id;
        document.getElementById('societyNameDisplay').textContent = society.nome;
        
        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        if (list) {
            list.innerHTML = '';
            athletes?.forEach(a => {
                const row = list.insertRow();
                row.innerHTML = `
                    <td>${a.first_name} ${a.last_name}</td>
                  <td>${a.classe}</td>
                  <td>${a.specialty}</td>
                   <td>${a.belt}</td>
                    <td>${a.gender}</td>
                   <td>${a.weight_category || '-'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="removeAthlete('${a.id}')">Elimina</button></td>
                `;
            });
        }
    }
    await updateAllCounters();
}

async function removeAthlete(id) {
    if (confirm("Eliminare definitivamente questo atleta?")) {
        await sb.from('atleti').delete().eq('id', id);
        fetchAthletes();
    }
}

// --- 7. EVENTI ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();
    document.getElementById('athleteForm')?.addEventListener('submit', addAthlete);
    document.getElementById('birthdate')?.addEventListener('change', updateSpecialtyOptionsBasedOnBirthdate);
    document.getElementById('specialty')?.addEventListener('change', toggleWeightCategory);
    document.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener('change', toggleWeightCategory));
});
