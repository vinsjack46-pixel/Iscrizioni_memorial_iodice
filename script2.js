// script2.js
const sb = window.supabaseClient;

// Calcolo limiti e conteggi
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") return 672;
    if (specialty === "Kata") return 145;
    if (specialty === "ParaKarate") return 50;
    if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino"].includes(specialty)) return 225;
    return Infinity;
}

async function updateAllCounters() {
    const specialties = ["Kumite", "Kata", "ParaKarate"];
    for (const spec of specialties) {
        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', spec);
        const el = document.getElementById(spec.toLowerCase() + 'AthleteCountDisplay');
        if (el) el.textContent = `${getMaxAthletesForSpecialty(spec) - (count || 0)} / ${getMaxAthletesForSpecialty(spec)}`;
    }
    
    // KIDS (Unificato)
    const { count: kidsCount } = await sb.from('atleti').select('*', { count: 'exact', head: true }).in('specialty', ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"]);
    const kidsEl = document.getElementById('KIDSAthleteCountDisplay');
    if (kidsEl) kidsEl.textContent = `${225 - (kidsCount || 0)} / 225`;
}

// Gestione tabella atleti
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
        <td><button class="btn btn-danger btn-sm" onclick="removeAthlete('${athlete.id}', this.parentElement.parentElement)">Elimina</button></td>
    `;
}

async function fetchAthletes() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', user.id).single();
    if (society) {
        document.getElementById('societyNameDisplay').textContent = society.nome;
        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        if (list) list.innerHTML = '';
        if (athletes) athletes.forEach(addAthleteToTable);
    }
    updateAllCounters();
}

async function removeAthlete(id, row) {
    if (confirm("Rimuovere definitivamente questo atleta?")) {
        const { error } = await sb.from('atleti').delete().eq('id', id);
        if (!error) { row.remove(); updateAllCounters(); }
    }
}

// Logica dinamica del modulo
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const weightField = document.getElementById("weightCategory");
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const classe = document.getElementById("classe")?.value;

    weightField.innerHTML = '<option value="">-- Seleziona --</option>';
    if (specialty === "Kumite" && classe === "Esordienti") {
        weightField.disabled = false;
        const weights = gender === "Maschio" ? ["-40","-45","-50","-55","+55"] : ["-42","-47","-52","+52"];
        weights.forEach(w => weightField.innerHTML += `<option value="${w}">${w} kg</option>`);
    } else {
        weightField.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('athleteList')) fetchAthletes();
    
    document.getElementById('birthdate')?.addEventListener('change', function() {
        const year = new Date(this.value).getFullYear();
        const classeSelect = document.getElementById("classe");
        let classe = year >= 2012 && year <= 2013 ? "Esordienti" : "Altro"; 
        if (classeSelect) classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
        toggleWeightCategory();
    });
});
