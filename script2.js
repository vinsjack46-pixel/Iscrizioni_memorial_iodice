//================================================================================
// 1. GESTIONE LIMITI MASSIMI E CONTEGGIO UNIFICATO KIDS
//================================================================================

function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") {
        return 672; // Rimosso il secondo return duplicato 
    } else if (specialty === "Kata") {
        return 145; [cite: 76]
    } else if (specialty === "ParaKarate") {
        return 50; [cite: 76]
    } else if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino") {
        return 225; [cite: 77]
    } else {
        return Infinity; [cite: 78]
    }
}

async function getKidsCount() {
    const specialtyList = ["Percorso-Palloncino", "Percorso-Kata", "Palloncino"]; [cite: 78]
    const { count, error } = await supabase
        .from('atleti')
        .select('*', { count: 'exact', head: true })
        .in('specialty', specialtyList); [cite: 79]
    if (error) {
        console.error("Errore nel conteggio atleti KIDS:", error.message); [cite: 80]
        return { count: 0, error: error };
    }
    return { count: count || 0, error: null }; [cite: 80, 81]
}

async function updateAthleteCountDisplay(specialty) {
    let currentCount = 0; [cite: 81]
    let maxAthletes = getMaxAthletesForSpecialty(specialty); [cite: 82]
    let counterElementId = '';

    if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino") {
        const result = await getKidsCount(); [cite: 82]
        if (result.error) return; [cite: 83]
        currentCount = result.count;
        counterElementId = 'KIDSAthleteCountDisplay';
    } else {
        counterElementId = (specialty === "Kumite") ? 'kumiteAthleteCountDisplay' : 
                           (specialty === "Kata") ? 'kataAthleteCountDisplay' : 
                           (specialty === "ParaKarate") ? 'ParaKarateAthleteCountDisplay' : ''; [cite: 83, 84]
        
        const { count, error: countError } = await supabase
            .from('atleti')
            .select('*', { count: 'exact', head: true })
            .eq('specialty', specialty); [cite: 85]
        if (countError) {
            console.error(`Errore nel conteggio per ${specialty}:`, countError.message); [cite: 86]
            return;
        }
        currentCount = count || 0; [cite: 86]
    }

    const remainingSlots = maxAthletes - currentCount; [cite: 87]
    const counterElement = document.getElementById(counterElementId);
    if (counterElement) {
        const displaySpecialty = (counterElementId === 'KIDSAthleteCountDisplay') ? 'KIDS' : specialty; [cite: 87, 88]
        counterElement.textContent = `Posti disponibili per ${displaySpecialty}: ${remainingSlots} / ${maxAthletes}`; [cite: 88]
    }
}

async function updateAllCounters() {
    await updateAthleteCountDisplay("Kumite"); [cite: 89]
    await updateAthleteCountDisplay("Kata"); [cite: 89]
    await updateAthleteCountDisplay("ParaKarate"); [cite: 89]
    await updateAthleteCountDisplay("Percorso-Kata"); [cite: 90]
}

//================================================================================
// 2. LOGICA DI INSERIMENTO E GESTIONE DATI
//================================================================================

function addAthleteToTable(athlete) {
    const athleteList = document.getElementById('athleteList'); [cite: 91]
    const row = athleteList.insertRow();
    row.insertCell().textContent = athlete.first_name; [cite: 92]
    row.insertCell().textContent = athlete.last_name; [cite: 92]
    row.insertCell().textContent = athlete.gender; [cite: 93]
    row.insertCell().textContent = athlete.birthdate; [cite: 93]
    row.insertCell().textContent = athlete.belt; [cite: 93]
    row.insertCell().textContent = athlete.classe; [cite: 94]
    row.insertCell().textContent = athlete.specialty; [cite: 94]
    row.insertCell().textContent = athlete.weight_category || ''; [cite: 94, 95]
    row.insertCell().textContent = athlete.society_id; [cite: 95]

    const actionsCell = row.insertCell();
    const removeButton = document.createElement('button'); [cite: 95]
    removeButton.textContent = 'Rimuovi'; [cite: 96]
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm'); [cite: 96]
    removeButton.addEventListener('click', () => removeAthlete(athlete.id, row)); [cite: 96]
    actionsCell.appendChild(removeButton);
}

async function addAthlete() {
    const firstName = document.getElementById("firstName").value; [cite: 96]
    const lastName = document.getElementById("lastName").value; [cite: 97]
    const gender = document.querySelector('input[name="gender"]:checked'); [cite: 97]
    const birthdate = document.getElementById("birthdate").value; [cite: 97]
    const classe = document.getElementById("classe").value; [cite: 97]
    const specialty = document.getElementById("specialty").value; [cite: 97]
    const weightCategory = document.getElementById("weightCategory").value; [cite: 98]
    const belt = document.getElementById("belt").value; [cite: 98]
    const societyName = document.getElementById("society").value; [cite: 98]

    if (!firstName || !lastName || !gender || !birthdate || !classe || !specialty || !belt || !societyName) {
        alert("Mancano campi obbligatori."); [cite: 99]
        return;
    }

    const { data: societyData, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('nome', societyName)
        .single(); [cite: 100]

    if (societyError || !societyData) {
        alert('Società non trovata.'); [cite: 101]
        return;
    }

    const maxAthletes = getMaxAthletesForSpecialty(specialty); [cite: 101]
    let currentCount = 0; [cite: 102]

    if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata" || specialty === "Palloncino") {
        const result = await getKidsCount(); [cite: 102]
        currentCount = result.count;
    } else {
        const { count } = await supabase.from('atleti').select('*', { count: 'exact', head: true }).eq('specialty', specialty); [cite: 103, 104]
        currentCount = count || 0;
    }

    if (currentCount >= maxAthletes) {
        alert(`Limite raggiunto per ${specialty}.`); [cite: 105]
        return;
    }

    const { data: newAthlete, error } = await supabase
        .from('atleti')
        .insert([{
            first_name: firstName,
            last_name: lastName,
            gender: gender.value,
            birthdate: birthdate,
            classe: classe,
            specialty: specialty,
            weight_category: weightCategory,
            belt: belt,
            society_id: societyData.id
        }]).select(); [cite: 106]

    if (!error && newAthlete.length > 0) {
        alert('Atleta aggiunto!'); [cite: 108]
        addAthleteToTable(newAthlete[0]); [cite: 108]
        await updateAllCounters(); [cite: 108]
        // Pulizia campi
        document.getElementById("firstName").value = ""; [cite: 109]
        document.getElementById("lastName").value = ""; [cite: 109]
        gender.checked = false; [cite: 110]
    }
}

async function fetchAthletes() {
    const athleteList = document.getElementById('athleteList');
    if (!athleteList) return;
    athleteList.innerHTML = ''; [cite: 112]

    const { data: userData } = await supabase.auth.getUser(); [cite: 112]
    if (!userData?.user?.id) return; [cite: 113] // Corretto errore sintassi ?.

    const { data: societyData } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', userData.user.id)
        .single(); [cite: 113]

    if (societyData) {
        const { data: athletesData } = await supabase
            .from('atleti')
            .select('*')
            .eq('society_id', societyData.id); [cite: 115]
        if (athletesData) {
            athletesData.forEach(athlete => addAthleteToTable(athlete)); [cite: 116]
        }
    }
    await updateAllCounters(); [cite: 117]
}

async function removeAthlete(athleteId, rowToRemove) {
    if (confirm('Sei sicuro?')) {
        const { error } = await supabase.from('atleti').delete().eq('id', athleteId); [cite: 118, 119]
        if (!error) {
            rowToRemove.remove(); [cite: 120]
            await updateAllCounters(); [cite: 121]
        }
    }
}

function toggleWeightCategory() {
    const specialty = document.getElementById("specialty").value; [cite: 121]
    const genderElement = document.querySelector('input[name="gender"]:checked');
    if (!genderElement) return;
    const gender = genderElement.value; [cite: 121]
    const weightCategoryField = document.getElementById("weightCategory"); [cite: 122]
    const classe = document.getElementById("classe").value; // Aggiunta variabile mancante

    weightCategoryField.innerHTML = ""; [cite: 123]
    
    if (specialty === "Kumite") {
        weightCategoryField.removeAttribute("disabled"); [cite: 122]
        // Qui inserisci le tue opzioni di peso in base alla classe [cite: 123-143]
        if (classe === "Esordienti") {
            if (gender === "Maschio") {
                weightCategoryField.innerHTML = '<option value="-40">-40</option><option value="-45">-45</option><option value="-50">-50</option><option value="-55">-55</option><option value="+55">+55</option>'; [cite: 123]
            } else {
                weightCategoryField.innerHTML = '<option value="-42">-42</option><option value="-47">-47</option><option value="-52">-52</option><option value="+52">+52</option>'; [cite: 124]
            }
        }
        // ... (altre classi Kumite come da tuo originale)
    } else if (specialty === "ParaKarate") {
        weightCategoryField.removeAttribute("disabled"); [cite: 143]
        weightCategoryField.innerHTML = '<option value="K20">K 20</option><option value="K21">K 21</option><option value="K30">K 30</option>'; [cite: 144]
    } else {
        weightCategoryField.setAttribute("disabled", "disabled"); [cite: 148]
    }
    updateBeltOptions(); [cite: 148]
}

function updateSpecialtyOptionsBasedOnBirthdate() {
    const birthdateInput = document.getElementById("birthdate"); [cite: 148]
    const specialtySelect = document.getElementById("specialty"); [cite: 149]
    const birthYear = new Date(birthdateInput.value).getFullYear(); [cite: 149]

    specialtySelect.innerHTML = ""; [cite: 149]
    if (birthYear >= 2018 && birthYear <= 2021) {
        specialtySelect.innerHTML = '<option value="Percorso-Kata">Percorso-Kata</option><option value="Percorso-Palloncino">Percorso-Palloncino</option><option value="ParaKarate">ParaKarate</option>'; [cite: 150]
    } else if (birthYear >= 2016 && birthYear <= 2017) {
        specialtySelect.innerHTML = '<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="Palloncino">Palloncino</option><option value="ParaKarate">ParaKarate</option>'; [cite: 151]
    } else {
        specialtySelect.innerHTML = '<option value="Kata">Kata</option><option value="Kumite">Kumite</option><option value="ParaKarate">ParaKarate</option>'; [cite: 152]
    }
}

function updateBeltOptions() {
    const classe = document.getElementById("classe").value; [cite: 154]
    const beltSelect = document.getElementById("belt"); [cite: 154]
    beltSelect.innerHTML = ""; [cite: 155]
    if (classe === "Fanciulli" || classe === "Ragazzi" || classe === "Esordienti") {
        beltSelect.innerHTML = '<option value="Gialla">Gialla</option><option value="Arancio-Verde">Arancio-Verde</option><option value="Blu-Marrone">Blu-Marrone</option>'; [cite: 156, 158]
    } else {
        beltSelect.innerHTML = '<option value="Tutte le cinture">Tutte le cinture</option>'; [cite: 162]
    }
}

// Event Listeners
document.getElementById("birthdate").addEventListener("change", function() {
    const birthYear = new Date(this.value).getFullYear(); [cite: 163]
    const classeSelect = document.getElementById("classe");
    let classe = "";

    if (birthYear >= 2010 && birthYear <= 2011) classe = "Cadetti"; [cite: 163]
    else if (birthYear >= 2012 && birthYear <= 2013) classe = "Esordienti"; [cite: 163]
    else if (birthYear >= 2014 && birthYear <= 2015) classe = "Ragazzi"; [cite: 163]
    else if (birthYear >= 2016 && birthYear <= 2017) classe = "Fanciulli"; [cite: 164]
    else classe = "Master"; [cite: 169]

    classeSelect.innerHTML = `<option value="${classe}">${classe}</option>`; [cite: 163]
    updateSpecialtyOptionsBasedOnBirthdate();
    toggleWeightCategory();
});

document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener("change", toggleWeightCategory); [cite: 169]
});

// Avvio iniziale
fetchAthletes();
