// script2.js - CORRETTO

//================================================================================
// 1. GESTIONE LIMITI MASSIMI E CONTEGGIO
//================================================================================

function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") {
        return 672;
    } else if (specialty === "Kata") {
        return 145;
    } else if (specialty === "ParaKarate") {
        return 50;
    } else if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino") {
        return 225; 
    } else {
        return Infinity;
    }
}

async function getKidsCount() {
    const specialtyList = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"];
    const { count, error } = await supabase
        .from('atleti')
        .select('*', { count: 'exact', head: true })
        .in('specialty', specialtyList); 

    if (error) {
        console.error("Errore nel conteggio atleti KIDS:", error.message);
        return { count: 0, error: error };
    }
    return { count: count || 0, error: null };
}

async function updateAthleteCountDisplay(specialty) {
    let currentCount = 0;
    let maxAthletes = getMaxAthletesForSpecialty(specialty);
    let counterElementId = '';

    if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino") {
        const result = await getKidsCount();
        if (result.error) return;
        currentCount = result.count;
        counterElementId = 'KIDSAthleteCountDisplay';
    } else {
        if (specialty === "Kumite") counterElementId = 'kumiteAthleteCountDisplay';
        else if (specialty === "Kata") counterElementId = 'kataAthleteCountDisplay';
        else if (specialty === "ParaKarate") counterElementId = 'ParaKarateAthleteCountDisplay';

        const { count, error } = await supabase
            .from('atleti')
            .select('*', { count: 'exact', head: true })
            .eq('specialty', specialty);
        
        if (error) return;
        currentCount = count || 0;
    }

    const remainingSlots = maxAthletes - currentCount;
    const counterElement = document.getElementById(counterElementId);
    if (counterElement) {
        counterElement.textContent = `${remainingSlots} / ${maxAthletes}`;
    }
}

async function updateAllCounters() {
    await updateAthleteCountDisplay("Kumite");
    await updateAthleteCountDisplay("Kata");
    await updateAthleteCountDisplay("ParaKarate");
    await updateAthleteCountDisplay("Percorso-Kata");
}

//================================================================================
// 2. LOGICA TABELLA E INSERIMENTO
//================================================================================

function addAthleteToTable(athlete) {
    const athleteList = document.getElementById('athleteList');
    if (!athleteList) return;
    const row = athleteList.insertRow();
    row.insertCell().textContent = athlete.first_name;
    row.insertCell().textContent = athlete.last_name;
    row.insertCell().textContent = athlete.gender;
    row.insertCell().textContent = athlete.birthdate;
    row.insertCell().textContent = athlete.belt;
    row.insertCell().textContent = athlete.classe;
    row.insertCell().textContent = athlete.specialty;
    row.insertCell().textContent = athlete.weight_category || '-';
    row.insertCell().textContent = athlete.society_id;

    const actionsCell = row.insertCell();
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Rimuovi';
    removeButton.className = 'btn btn-danger btn-sm';
    removeButton.onclick = () => removeAthlete(athlete.id, row);
    actionsCell.appendChild(removeButton);
}

async function fetchAthletes() {
    // CORRETTO: rimosso l'errore di sintassi ':' che avevi nel file originale
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) return;

    const { data: societyData } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

    if (societyData) {
        const { data: athletes } = await supabase
            .from('atleti')
            .select('*')
            .eq('society_id', societyData.id);
        
        const athleteList = document.getElementById('athleteList');
        if (athleteList) athleteList.innerHTML = '';
        if (athletes) athletes.forEach(addAthleteToTable);
    }
    await updateAllCounters();
}

async function removeAthlete(id, row) {
    const { error } = await supabase.from('atleti').delete().eq('id', id);
    if (!error) {
        row.remove();
        await updateAllCounters();
    }
}

//================================================================================
// 3. EVENTI E DINAMICHE FORM
//================================================================================

function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const weightCategoryField = document.getElementById("weightCategory");
    const classe = document.getElementById("classe").value; // Variabile ora definita correttamente

    if (!weightCategoryField) return;
    weightCategoryField.innerHTML = '<option value="">-- Seleziona Peso --</option>';

    if (specialty === "Kumite") {
        weightCategoryField.disabled = false;
        if (classe === "Esordienti") {
            if (gender === "Maschio") {
                ["-40","-45","-50","-55","+55"].forEach(w => {
                    weightCategoryField.innerHTML += `<option value="${w}">${w} kg</option>`;
                });
            } else {
                ["-42","-47","-52","+52"].forEach(w => {
                    weightCategoryField.innerHTML += `<option value="${w}">${w} kg</option>`;
                });
            }
        }
        // Aggiungi qui le altre classi se necessario
    } else {
        weightCategoryField.disabled = true;
    }
}

// Inizializzazione al caricamento
document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();

    const birthdateInput = document.getElementById("birthdate");
    if (birthdateInput) {
        birthdateInput.addEventListener("change", function() {
            const birthYear = new Date(this.value).getFullYear();
            const classeSelect = document.getElementById("classe");
            let classe = "";

            if (birthYear >= 2010 && birthYear <= 2011) classe = "Cadetti";
            else if (birthYear >= 2012 && birthYear <= 2013) classe = "Esordienti";
            else if (birthYear >= 2014 && birthYear <= 2015) classe = "Ragazzi";
            else if (birthYear >= 2016 && birthYear <= 2017) classe = "Fanciulli";
            else if (birthYear >= 2018 && birthYear <= 2021) classe = "KIDS";
            else classe = "Seniores/Master";

            if (classeSelect) {
                classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`;
            }
            toggleWeightCategory();
        });
    }
});
