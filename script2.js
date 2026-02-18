// script2.js
const sb = window.supabaseClient;

// --- 1. GESTIONE CONTEGGI ---
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") return 672;
    if (specialty === "Kata") return 145;
    if (specialty === "ParaKarate") return 50;
    if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty)) return 225;
    return Infinity;
}

async function updateAthleteCountDisplay(specialty) {
    let currentCount = 0;
    const max = getMaxAthletesForSpecialty(specialty);
    let counterId = '';

    if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty)) {
        counterId = 'KIDSAthleteCountDisplay';
        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).in('specialty', ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"]);
        currentCount = count || 0;
    } else {
        if (specialty === "Kumite") counterId = 'kumiteAthleteCountDisplay';
        else if (specialty === "Kata") counterId = 'kataAthleteCountDisplay';
        else if (specialty === "ParaKarate") counterId = 'ParaKarateAthleteCountDisplay';

        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', specialty);
        currentCount = count || 0;
    }

    const element = document.getElementById(counterId);
    if (element) element.textContent = `${max - currentCount} / ${max}`;
}


// --- 1. AGGIORNAMENTO CINTURE IN BASE ALLA CLASSE ---
function updateBelts(classe) {
    const beltSelect = document.getElementById("belt");
    if (!beltSelect) return;

    let belts = ["Bianca", "Bianca/Gialla", "Gialla", "Gialla/Arancio", "Arancio"];

    if (classe === "Fanciulli") {
        belts.push("Arancio/Verde", "Verde");
    } else if (classe === "Ragazzi") {
        belts.push("Arancio/Verde", "Verde", "Verde/Blu", "Blu", "Blu/Marrone", "Marrone");
    } else if (["Esordienti", "Cadetti", "Seniores/Master"].includes(classe)) {
        belts.push("Arancio/Verde", "Verde", "Verde/Blu", "Blu", "Blu/Marrone", "Marrone", "Nera");
    }

    beltSelect.innerHTML = belts.map(b => `<option value="${b}">${b}</option>`).join('');
}

// --- 2. LOGICA PESI E CATEGORIE ---
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const classe = document.getElementById("classe")?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightField = document.getElementById("weightCategory");

    if (!weightField) return;
    weightField.innerHTML = '<option value="">-- Seleziona Peso/Cat --</option>';
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
        ["K10", "K21", "K22", "K30"].forEach(k => {
            weightField.innerHTML += `<option value="${k}">${k}</option>`;
        });
    }
}

// --- 3. GESTIONE SOCIETÀ E TABELLA ---
async function fetchAthletes() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', user.id).single();
    
    if (society) {
        if (document.getElementById('societyNameDisplay')) 
            document.getElementById('societyNameDisplay').textContent = society.nome;
        
        if (document.getElementById('society')) 
            document.getElementById('society').value = society.nome;

        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        if (list) {
            list.innerHTML = '';
            if (athletes) athletes.forEach(addAthleteToTable);
        }
    }
    updateAllCounters();
}

function addAthleteToTable(athlete) {
    const list = document.getElementById('athleteList');
    if (!list) return;
    const row = list.insertRow();
    row.innerHTML = `
        <td>${athlete.first_name}</td><td>${athlete.last_name}</td>
        <td>${athlete.gender}</td><td>${athlete.birthdate}</td>
        <td>${athlete.belt}</td><td>${athlete.classe}</td>
        <td>${athlete.specialty}</td><td>${athlete.weight_category || '-'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeAthlete('${athlete.id}', this.parentElement.parentElement)">Elimina</button></td>
    `;
}

// --- 4. CONTEGGI ---
async function updateAllCounters() {
    const specs = ["Kumite", "Kata", "ParaKarate"];
    for (const s of specs) {
        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', s);
        const el = document.getElementById(s.toLowerCase() + 'AthleteCountDisplay') || document.getElementById(s + 'AthleteCountDisplay');
        if (el) el.textContent = `${(s === "Kumite" ? 672 : s === "Kata" ? 145 : 50) - (count || 0)} / ${(s === "Kumite" ? 672 : s === "Kata" ? 145 : 50)}`;
    }
}

// --- 5. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();

    document.getElementById("birthdate")?.addEventListener("change", function() {
        const year = new Date(this.value).getFullYear();
        const clSel = document.getElementById("classe");
        const spSel = document.getElementById("specialty");
        let classe = "";

        if (year >= 2018 && year <= 2021) classe = "KIDS";
        else if (year >= 2016 && year <= 2017) classe = "Fanciulli";
        else if (year >= 2014 && year <= 2015) classe = "Ragazzi";
        else if (year >= 2012 && year <= 2013) classe = "Esordienti";
        else if (year >= 2010 && year <= 2011) classe = "Cadetti";
        else classe = "Seniores/Master";

        if (clSel) clSel.innerHTML = `<option value="${classe}">${classe}</option>`;
        
        // Aggiorna Cinture
        updateBelts(classe);

        // Aggiorna Specialità
        if (spSel) {
            if (classe === "KIDS") {
                spSel.innerHTML = '<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>';
            } else if (classe === "Fanciulli") {
                spSel.innerHTML = '<option value="Kata">Kata</option><option value="Palloncino">Palloncino</option><option value="ParaKarate">ParaKarate</option>';
            } else {
                spSel.innerHTML = '<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>';
            }
        }
        toggleWeightCategory();
    });

    document.getElementById("specialty")?.addEventListener("change", toggleWeightCategory);
    document.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener("change", toggleWeightCategory));
});

async function removeAthlete(id, row) {
    if (confirm("Eliminare?")) {
        const { error } = await sb.from('atleti').delete().eq('id', id);
        if (!error) { row.remove(); updateAllCounters(); }
    }
}
