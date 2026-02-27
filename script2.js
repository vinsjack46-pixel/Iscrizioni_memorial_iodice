// script2.js
const sb = window.supabaseClient;
let currentSocietyId = null;

// --- 1. GESTIONE CLASSI, CINTURE E SPECIALITA' ---
function updateSpecialtyOptionsBasedOnBirthdate() {
    const birthInput = document.getElementById("birthdate");
    if (!birthInput.value) return;

    const year = new Date(birthInput.value).getFullYear();
    const clSel = document.getElementById("classe");
    const spSel = document.getElementById("specialty");
    const beltSel = document.getElementById("belt");
    let classe = "";

    // Logica Classi
    if (year >= 2018 && year <= 2021) classe = "KIDS";
    else if (year >= 2016 && year <= 2017) classe = "Fanciulli";
    else if (year >= 2014 && year <= 2015) classe = "Ragazzi";
    else if (year >= 2012 && year <= 2013) classe = "Esordienti";
    else if (year >= 2010 && year <= 2011) classe = "Cadetti";
    else classe = "Seniores/Master";

    clSel.innerHTML = `<option value="${classe}">${classe}</option>`;
    
    // Logica Cinture
    let belts = ["Selezionare Cintura"];
    if (classe === "KIDS") belts.push("Bianca/Gialla", "Arancio/Verde");
    else if (classe === "Fanciulli") belts.push("Bianca/Gialla", "Arancio/Verde", "Blu/Marrone");
    else if (["Ragazzi", "Esordienti", "Cadetti", "Seniores/Master"].includes(classe)) belts.push("Bianca/Gialla", "Arancio/Verde", "Blu/Marrone/Nera");
    
    beltSel.innerHTML = belts.map(b => `<option value="${b}">${b}</option>`).join('');

    // Logica Specialità
    if (classe === "KIDS") {
        spSel.innerHTML = '<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>';
    } else if (classe === "Fanciulli") {
        spSel.innerHTML = '<option value="Kata">Kata</option><option value="Palloncino">Palloncino</option><option value="ParaKarate">ParaKarate</option>';
    } else {
        spSel.innerHTML = '<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>';
    }
    toggleWeightCategory();
}

// --- 2. GESTIONE PESI ---
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const classe = document.getElementById("classe")?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightField = document.getElementById("weightCategory");

    weightField.innerHTML = '<option value="">-- Seleziona --</option>';
    weightField.disabled = true;

    if (specialty === "Kumite") {
        weightField.disabled = false;
        let weights = [];
        if (classe === "Esordienti") weights = (gender === "Maschio") ? ["-40", "-45", "-50", "-55", "+55"] : ["-42", "-47", "-52", "+52"];
        else if (classe === "Cadetti") weights = (gender === "Maschio") ? ["-52", "-57", "-63", "-70", "+70"] : ["-47", "-54", "-61", "+61"];
        else weights = ["Open"];
        weights.forEach(w => weightField.innerHTML += `<option value="${w}">${w} kg</option>`);
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K10", "K21", "K22", "K30"].forEach(k => weightField.innerHTML += `<option value="${k}">${k}</option>`);
    }
}

// --- 3. CONTEGGI AGGIORNATI ---
async function updateAllCounters() {
    // Kumite
    const { count: countKumite } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', 'Kumite');
    document.getElementById('kumiteAthleteCountDisplay').textContent = `${672 - (countKumite || 0)} / 672`;

    // Kata
    const { count: countKata } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', 'Kata');
    document.getElementById('kataAthleteCountDisplay').textContent = `${145 - (countKata || 0)} / 145`;

    // Para
    const { count: countPara } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', 'ParaKarate');
    document.getElementById('ParaKarateAthleteCountDisplay').textContent = `${50 - (countPara || 0)} / 50`;

    // KIDS (Tutte le specialità percorso)
    const { count: countKids } = await sb.from('atleti').select('*', { count: 'exact', head: true }).in('specialty', ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"]);
    document.getElementById('KIDSAthleteCountDisplay').textContent = `${225 - (countKids || 0)} / 225`;
}

// --- 4. SALVATAGGIO ---
async function addAthlete(event) {
    event.preventDefault();
    if (!currentSocietyId) return alert("Errore caricamento società.");

    const athleteData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        birthdate: document.getElementById('birthdate').value,
        belt: document.getElementById('belt').value,
        classe: document.getElementById('classe').value,
        specialty: document.getElementById('specialty').value,
        weight_category: document.getElementById('weightCategory').value || null,
        society_id: currentSocietyId
    };

    const { error } = await sb.from('atleti').insert([athleteData]);
    if (error) alert("Errore: " + error.message);
    else {
        alert("Atleta salvato!");
        document.getElementById('athleteForm').reset();
        fetchAthletes(); // Ricarica tabella e conteggi
    }
}

// --- 5. INIZIALIZZAZIONE ---
async function fetchAthletes() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', user.id).single();
    if (society) {
        currentSocietyId = society.id;
        document.getElementById('societyNameDisplay').textContent = society.nome;
        document.getElementById('society').value = society.nome;
        
        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        list.innerHTML = '';
        athletes?.forEach(a => {
            const row = list.insertRow();
            row.innerHTML = `<td>${a.first_name} ${a.last_name}</td><td>${a.classe}</td><td>${a.specialty}</td><td>${a.weight_category || '-'}</td><td><button class="btn btn-sm btn-danger" onclick="removeAthlete('${a.id}')">Elimina</button></td>`;
        });
    }
    updateAllCounters();
}

async function removeAthlete(id) {
    if (confirm("Eliminare l'atleta?")) {
        await sb.from('atleti').delete().eq('id', id);
        fetchAthletes();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();
    document.getElementById('athleteForm').addEventListener('submit', addAthlete);
});
