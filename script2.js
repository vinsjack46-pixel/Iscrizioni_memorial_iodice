// script2.js
// Usiamo supabaseClient definito in script.js
const sb = window.supabaseClient;

// 1. Limiti e Conteggi
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
        if (specialty === "Kumite") counterId = 'kumiteAthleteCountDisplay';
        else if (specialty === "Kata") counterId = 'kataAthleteCountDisplay';
        else if (specialty === "ParaKarate") counterId = 'ParaKarateAthleteCountDisplay';

        const { count } = await sb.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', specialty);
        currentCount = count || 0;
    }

    const element = document.getElementById(counterId);
    if (element) element.textContent = `${maxAthletes - currentCount} / ${maxAthletes}`;
}

async function updateAllCounters() {
    await updateAthleteCountDisplay("Kumite");
    await updateAthleteCountDisplay("Kata");
    await updateAthleteCountDisplay("ParaKarate");
    await updateAthleteCountDisplay("Percorso-Kata");
}

// 2. Tabella
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

async function fetchAthletes() {
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) return;

    const { data: society } = await sb.from('societa').select('id, nome').eq('user_id', userData.user.id).single();
    if (society) {
        document.getElementById('societyNameDisplay').textContent = society.nome;
        const { data: athletes } = await sb.from('atleti').select('*').eq('society_id', society.id);
        const list = document.getElementById('athleteList');
        if (list) list.innerHTML = '';
        if (athletes) athletes.forEach(addAthleteToTable);
    }
    await updateAllCounters();
}

async function removeAthlete(id, row) {
    if (!confirm("Rimuovere l'atleta?")) return;
    const { error } = await sb.from('atleti').delete().eq('id', id);
    if (!error) {
        row.remove();
        await updateAllCounters();
    }
}

// 3. Dinamiche Form
function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightField = document.getElementById("weightCategory");
    const classe = document.getElementById("classe")?.value;

    if (!weightField) return;
    weightField.innerHTML = '<option value="">-- Seleziona --</option>';

    if (specialty === "Kumite" && classe === "Esordienti") {
        weightField.disabled = false;
        const options = gender === "Maschio" ? ["-40", "-45", "-50", "-55", "+55"] : ["-42", "-47", "-52", "+52"];
        options.forEach(w => weightField.innerHTML += `<option value="${w}">${w} kg</option>`);
    } else {
        weightField.disabled = true;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();
    
    const birthInput = document.getElementById("birthdate");
    if (birthInput) {
        birthInput.addEventListener("change", function() {
            const year = new Date(this.value).getFullYear();
            const classeSelect = document.getElementById("classe");
            let classe = "";
            if (year >= 2010 && year <= 2011) classe = "Cadetti";
            else if (year >= 2012 && year <= 2013) classe = "Esordienti";
            else if (year >= 2014 && year <= 2015) classe = "Ragazzi";
            else if (year >= 2016 && year <= 2017) classe = "Fanciulli";
            else if (year >= 2018 && year <= 2021) classe = "KIDS";
            else classe = "Master";
            
            if (classeSelect) classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
            toggleWeightCategory();
        });
    }
});
