// script2.js
const sb = window.supabaseClient;

// --- 1. GESTIONE LIMITI E CONTEGGI ---
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") return 672;
    if (specialty === "Kata") return 145;
    if (specialty === "ParaKarate") return 50;
    if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty)) return 225;
    return Infinity;
}

async function updateAthleteCountDisplay(specialty) {
    let currentCount = 0;
    const maxAthletes = getMaxAthletesForSpecialty(specialty);
    let counterId = '';

    if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty)) {
        counterId = 'KIDSAthleteCountDisplay';
        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).in('specialty', ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"]);
        currentCount = count || 0;
    } else {
        // Mappatura ID HTML (Attenzione alle maiuscole/minuscole)
        if (specialty === "Kumite") counterId = 'kumiteAthleteCountDisplay';
        else if (specialty === "Kata") counterId = 'kataAthleteCountDisplay';
        else if (specialty === "ParaKarate") counterId = 'ParaKarateAthleteCountDisplay';

        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', specialty);
        currentCount = count || 0;
    }

    const element = document.getElementById(counterId);
    if (element) {
        const disponibili = maxAthletes - currentCount;
        element.textContent = `${disponibili} / ${maxAthletes}`;
    }
}

async function updateAllCounters() {
    await updateAthleteCountDisplay("Kumite");
    await updateAthleteCountDisplay("Kata");
    await updateAthleteCountDisplay("ParaKarate");
    await updateAthleteCountDisplay("Percorso-Kata");
}

// --- 2. RICONOSCIMENTO SOCIETÀ E TABELLA ---
async function fetchAthletes() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Recupero dati società
    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', user.id).single();
    
    if (society) {
        // Riempimento automatico dei campi società
        const display = document.getElementById('societyNameDisplay');
        const input = document.getElementById('society');
        if (display) display.textContent = society.nome;
        if (input) input.value = society.nome; // Qui risolve il tuo problema di riconoscimento

        // Recupero atleti della società
        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        if (list) {
            list.innerHTML = '';
            if (athletes) athletes.forEach(addAthleteToTable);
        }
    }
    await updateAllCounters();
}

function addAthleteToTable(athlete) {
    const list = document.getElementById('athleteList');
    if (!list) return;
    const row = list.insertRow();
    row.innerHTML = `
        <td>${athlete.first_name}</td>
        <td>${athlete.last_name}</td>
        <td>${athlete.gender}</td>
        <td>${athlete.birthdate}</td>
        <td>${athlete.belt}</td>
        <td>${athlete.classe}</td>
        <td>${athlete.specialty}</td>
        <td>${athlete.weight_category || '-'}</td>
        <td>${athlete.society_id}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeAthlete('${athlete.id}', this.parentElement.parentElement)">Rimuovi</button></td>
    `;
}

async function removeAthlete(id, row) {
    if (!confirm("Eliminare l'atleta?")) return;
    const { error } = await sb.from('atleti').delete().eq('id', id);
    if (!error) {
        row.remove();
        await updateAllCounters();
    }
}

// --- 3. LOGICA DINAMICA CATEGORIE E PESI ---
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightField = document.getElementById("weightCategory");
    const classe = document.getElementById("classe")?.value;

    if (!weightField) return;
    weightField.innerHTML = '<option value="">-- Seleziona Peso --</option>';

    if (specialty === "Kumite" && (classe === "Esordienti" || classe === "Cadetti")) {
        weightField.disabled = false;
        let options = [];
        if (classe === "Esordienti") {
            options = gender === "Maschio" ? ["-40", "-45", "-50", "-55", "+55"] : ["-42", "-47", "-52", "+52"];
        }
        options.forEach(w => {
            const opt = document.createElement("option");
            opt.value = w; opt.textContent = w + " kg";
            weightField.appendChild(opt);
        });
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K10", "K21", "K22", "K30"].forEach(k => {
            const opt = document.createElement("option");
            opt.value = k; opt.textContent = k;
            weightField.appendChild(opt);
        });
    } else {
        weightField.disabled = true;
    }
}

// Gestione cambio data di nascita (Classe + Specialità)
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();

    const birthdateInput = document.getElementById("birthdate");
    if (birthdateInput) {
        birthdateInput.addEventListener("change", function() {
            const birthYear = new Date(this.value).getFullYear();
            const classeSelect = document.getElementById("classe");
            const specialtySelect = document.getElementById("specialty");
            let classe = "";

            // Calcolo Classe
            if (birthYear >= 2010 && birthYear <= 2011) classe = "Cadetti";
            else if (birthYear >= 2012 && birthYear <= 2013) classe = "Esordienti";
            else if (birthYear >= 2014 && birthYear <= 2015) classe = "Ragazzi";
            else if (birthYear >= 2016 && birthYear <= 2017) classe = "Fanciulli";
            else if (birthYear >= 2018 && birthYear <= 2021) classe = "KIDS";
            else classe = "Master/Seniores";

            if (classeSelect) {
                classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
            }

            // Filtro Specialità per età
            if (specialtySelect) {
                specialtySelect.innerHTML = "";
                if (classe === "KIDS") {
                    specialtySelect.innerHTML = '<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>';
                } else if (classe === "Fanciulli") {
                    specialtySelect.innerHTML = '<option value="Kata">Kata</option><option value="Palloncino">Palloncino</option><option value="ParaKarate">ParaKarate</option>';
                } else {
                    specialtySelect.innerHTML = '<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>';
                }
            }
            toggleWeightCategory();
        });
    }

    // Listener per il cambio genere
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', toggleWeightCategory);
    });
    // Listener per il cambio specialità
    document.getElementById("specialty")?.addEventListener('change', toggleWeightCategory);
});
