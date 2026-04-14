const sb = window.supabaseClient;
let currentSocietyId = null;

// --- 1. LIMITI RIGIDI ---
const LIMITI = {
    "Kumite": 28,
    "Kata": 300,
    "ParaKarate": 50,
    "KIDS": 250 
};

function updateSpecialtyOptionsBasedOnBirthdate() {
    const birthInput = document.getElementById("birthdate");
    const errorDisplay = document.getElementById("dateError");
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (!birthInput || !birthInput.value) return;

    const year = new Date(birthInput.value).getFullYear();
    
    if (year > 999) { 
        if (year < 2013 || year > 2022) {
            errorDisplay.style.display = "block"; 
            submitBtn.disabled = true;           
            return; 
        } else {
            errorDisplay.style.display = "none";  
            submitBtn.disabled = false;          
        }
    }

    const clSel = document.getElementById("classe");
    const spSel = document.getElementById("specialty");
    const beltSel = document.getElementById("belt");
    let classe = "";

    if (year >= 2021 && year <= 2022) classe = "U6";
    else if (year >= 2019 && year <= 2020) classe = "U8";
    else if (year >= 2017 && year <= 2018) classe = "U10";
    else if (year >= 2015 && year <= 2016) classe = "U12";
    else if (year >= 2013 && year <= 2014) classe = "U14";
    else if (year >= 2011 && year <= 2012) classe = "Cadetti";
    else if (year >= 2009 && year <= 2010) classe = "Juniores";
    else if (year >= 1991 && year <= 2008) classe = "Seniores";
    else if (year >= 1960 && year <= 1990) classe = "Master";

    clSel.innerHTML = `<option value="${classe}">${classe}</option>`;
    
    let belts = [];
    if (classe.includes("KIDS")) {
        belts = ["Bianca/Gialla", "Arancio/Verde"];
    } else {
        belts = ["Bianca/Gialla", "Arancio/Verde", "Blu/Marrone"];
    }
    beltSel.innerHTML = belts.map(b => `<option value="${b}">${b}</option>`).join('');

    if (classe.includes("KIDS")) {
        spSel.innerHTML = `
            <option value="Percorso-Kata">Percorso-Kata</option>
            <option value="Percorso-Palloncino">Percorso-Palloncino</option>
            <option value="ParaKarate">ParaKarate</option>`;
    } else if (classe === "U6") {
        spSel.innerHTML = `
            <option value="Combinata">Combinata</option>
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="ParaKarate">ParaKarate</option>`;
         } else if (classe === "U8") {
        spSel.innerHTML = `
            <option value="Combinata">Combinata</option>
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="ParaKarate">ParaKarate</option>`
            ;
    } else {
        spSel.innerHTML = `
            <option value="Kata">Kata</option>
            <option value="Kumite">Kumite</option>
            <option value="ParaKarate">ParaKarate</option>`;
    }
    toggleWeightCategory();
}

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
        if (classe === "U14") {
            weights = (gender === "Maschio") ? ["-40", "-45", "-50", "-55", "55+"] : ["-42", "-47", "-52", "52+"];
        } else if (classe === "U12" || classe === "U10" || classe === "U8" || classe === "U6") {
            weights = (gender === "Maschio") ? ["-30", "-35", "-40", "40+",] : ["-30", "-35", "35+"];
        } else {
            weights = ["Open"];
        }
        weights.forEach(w => weightField.innerHTML += `<option value="${w}">${w} kg</option>`);
    } else if (specialty === "ParaKarate") {
        weightField.disabled = false;
        ["K10","K20", "K21", "K22", "K30", "K31", "K32", "K33", "K34", "K35", "K36", "K40"].forEach(k => weightField.innerHTML += `<option value="${k}">${k}</option>`);
    } else {
        weightField.innerHTML = `<option value="-">-</option>`;
    }
}

// --- 4. CONTEGGI PRIVATI E BLOCCO GLOBALE ---
async function updateAllCounters() {
    // Carica TUTTI gli atleti per il controllo limiti
    const { data: allAtleti, error: err1 } = await sb.from('atleti').select('specialty'); // <--- MODIFICA: Aggiunto controllo errore
    // Carica solo quelli della SOCIETÀ per il display
    const { data: myAtleti, error: err2 } = await sb.from('atleti').select('specialty').eq('society_id', currentSocietyId);
    
    if (err1 || err2) return { kumite: 0, kata: 0, para: 0, kids: 0 }; // <--- MODIFICA: Fallback di sicurezza

    const globalCounts = {
        kumite: allAtleti.filter(a => a.specialty === 'Kumite').length,
        kata: allAtleti.filter(a => a.specialty === 'Kata').length,
        para: allAtleti.filter(a => a.specialty === 'ParaKarate').length,
        kids: allAtleti.filter(a => ["Percorso-Palloncino", "Percorso-Kata", "Palloncino","Combinata"].includes(a.specialty)).length
    };

    const myCounts = {
        kumite: myAtleti.filter(a => a.specialty === 'Kumite').length,
        kata: myAtleti.filter(a => a.specialty === 'Kata').length,
        para: myAtleti.filter(a => a.specialty === 'ParaKarate').length,
        kids: myAtleti.filter(a => ["Percorso-Palloncino", "Percorso-Kata", "Palloncino","Combinata"].includes(a.specialty)).length
    };

    document.getElementById('kumiteAthleteCountDisplay').textContent = myCounts.kumite;
    document.getElementById('kataAthleteCountDisplay').textContent = myCounts.kata;
    document.getElementById('ParaKarateAthleteCountDisplay').textContent = myCounts.para;
    document.getElementById('KIDSAthleteCountDisplay').textContent = myCounts.kids;
    
    return globalCounts; 
}

// --- 5. AGGIUNTA ATLETA ---
async function addAthlete(event) {
    event.preventDefault();
    if (!currentSocietyId) return alert("Errore: Società non identificata.");

    // <--- MODIFICA: Disabilita tasto durante il controllo per evitare doppie sottomissioni
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const spec = document.getElementById('specialty').value;
    const counts = await updateAllCounters(); 
    
    let limitReached = false;
    // <--- MODIFICA: Controllo più rigoroso sui limiti
    if (spec === "Kumite" && counts.kumite >= LIMITI.Kumite) limitReached = true;
    else if (spec === "Kata" && counts.kata >= LIMITI.Kata) limitReached = true;
    else if (spec === "ParaKarate" && counts.para >= LIMITI.ParaKarate) limitReached = true;
    else if (["Percorso-Palloncino", "Percorso-Kata", "Palloncino","Combinata"].includes(spec) && counts.kids >= LIMITI.KIDS) limitReached = true;

    if (limitReached) {
        alert("ATTENZIONE: Posti esauriti nell'evento per questa specialità!");
        submitBtn.disabled = false; // <--- MODIFICA: Riabilita se bloccato
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
    
    if (error) {
        alert("Errore Supabase: " + error.message);
        submitBtn.disabled = false;
    } else {
        alert("Atleta registrato correttamente!");
        // <--- MODIFICA: Reset manuale forzato per caselle bianche
        event.target.reset();
        document.getElementById('classe').innerHTML = '<option value="">-- Classe --</option>';
        document.getElementById('specialty').innerHTML = '<option value="">-- Specialità --</option>';
        document.getElementById('belt').innerHTML = '<option value="">-- Cintura --</option>';
        document.getElementById('weightCategory').innerHTML = '<option value="-">-</option>';
        document.getElementById('weightCategory').disabled = true;
        
        await fetchAthletes();
        submitBtn.disabled = false;
    }
}

// --- 6. VISUALIZZAZIONE ---
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
        await fetchAthletes(); // <--- MODIFICA: Aggiunto await per precisione conteggi
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAthletes();
    document.getElementById('athleteForm')?.addEventListener('submit', addAthlete);
    document.getElementById('birthdate')?.addEventListener('change', updateSpecialtyOptionsBasedOnBirthdate);
    document.getElementById('specialty')?.addEventListener('change', toggleWeightCategory);
    document.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener('change', toggleWeightCategory));
});
