// Funzione per ottenere il limite massimo di atleti per specialità
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") {
        return 600;
    } else if (specialty === "Kata") {
        return 500;
} else if (specialty === "ParaKarate") {
        return 50;
} else if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata") {
        return 600;
    } else {
        return Infinity;
    }
}

// Funzione per aggiornare il contatore visualizzato
async function updateAthleteCountDisplay(specialty) {
    const maxAthletes = getMaxAthletesForSpecialty(specialty);
    const {
        data: currentCount,
        error: countError
    } = await supabase
        .from('atleti')
        .select('count', {
            count: 'exact'
        })
        .eq('specialty', specialty)
        .single();

    if (countError) {
        console.error(`Errore nel conteggio degli atleti per ${specialty}:`, countError.message);
        return;
    }

    const count = currentCount ? currentCount.count : 0;
    const remainingSlots = maxAthletes - count;

    let counterElementId = '';
    if (specialty === "Kumite") {
        counterElementId = 'kumiteAthleteCountDisplay';
    } else if (specialty === "Kata") {
        counterElementId = 'kataAthleteCountDisplay';
} else if (specialty === "ParaKarate") {
        counterElementId = 'ParaKarateAthleteCountDisplay'
} else if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata") {
        counterElementId = 'KIDSAthleteCountDisplay';
    }

    const counterElement = document.getElementById(counterElementId);
    if (counterElement) {
        counterElement.textContent = `Posti disponibili per ${specialty}: ${remainingSlots} / ${maxAthletes}`;
    }
}

function addAthleteToTable(athlete) {
    const athleteList = document.getElementById('athleteList');
    const row = athleteList.insertRow();

    const nameCell = row.insertCell();
    nameCell.textContent = athlete.first_name;

    const lastNameCell = row.insertCell();
    lastNameCell.textContent = athlete.last_name;

    const genderCell = row.insertCell();
    genderCell.textContent = athlete.gender;
    const birthdateCell = row.insertCell();
    birthdateCell.textContent = athlete.birthdate;

    const beltCell = row.insertCell();
    beltCell.textContent = athlete.belt;

    const classeCell = row.insertCell();
    classeCell.textContent = athlete.classe;

    const specialtyCell = row.insertCell();
    specialtyCell.textContent = athlete.specialty;

    const weightCategoryCell = row.insertCell();
    weightCategoryCell.textContent = athlete.weight_category || '';
    const societyCell = row.insertCell();
    societyCell.textContent = athlete.society_id;

    const actionsCell = row.insertCell();
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Rimuovi';
    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
    removeButton.addEventListener('click', () => removeAthlete(athlete.id, row));
    actionsCell.appendChild(removeButton);
}

async function addAthlete() {
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const gender = document.querySelector('input[name="gender"]:checked');
    const birthdate = document.getElementById("birthdate").value;
    const classe = document.getElementById("classe").value;
    const specialty = document.getElementById("specialty").value;
    const weightCategory = document.getElementById("weightCategory").value;
    const belt = document.getElementById("belt").value;
    const societyName = document.getElementById("society").value;

    // Controllo dei campi obbligatori
    if (!firstName || !lastName || !gender || !gender.checked || !birthdate || !classe || !specialty || !belt || !societyName) {
        alert("Mancano campi obbligatori.");
        return;
    }

    // Trova l'ID della società
    const { data: societyData, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('nome', societyName)
        .single();

    if (societyError) {
        alert('Società non trovata.');
        return;
    }

    const societyId = societyData.id;

    const maxAthletes = getMaxAthletesForSpecialty(specialty);
    const { data: currentCount, error: countError } = await supabase
        .from('atleti')
        .select('count', { count: 'exact' })
        .eq('specialty', specialty)
        .single();

    if (countError) {
        console.error('Errore nel conteggio degli atleti:', countError.message);
        alert('Errore interno del server.');
        return;
    }

    if (currentCount && currentCount.count >= maxAthletes) {
        alert(`Siamo spiacenti, il numero massimo di iscritti a ${specialty} è stato raggiunto.`);
        return;
    }

    // Inserisci l'atleta
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
            society_id: societyId // Associa l'atleta alla società
        }]).select();

    if (error) {
        console.error('Errore aggiunta atleta:', error.message);
        alert('Errore durante l\'aggiunta dell\'atleta.');
    } else if (newAthlete && newAthlete.length > 0) {
        alert('Atleta aggiunto con successo!');
        const athlete = newAthlete[0]; // Prendi il primo atleta dall'array

        await updateAthleteCountDisplay("Kumite");
        // Aggiorna il contatore di Kumite
        await updateAthleteCountDisplay("Kata");
        // Aggiorna il contatore di Kata

        // Aggiungi l'atleta alla tabella
        const athleteList = document.getElementById('athleteList');
        const row = athleteList.insertRow();

        const nameCell = row.insertCell();
        nameCell.textContent = athlete.first_name;

        const lastNameCell = row.insertCell();
        lastNameCell.textContent = athlete.last_name;
        const genderCell = row.insertCell();
        genderCell.textContent = athlete.gender;

        const birthdateCell = row.insertCell();
        birthdateCell.textContent = athlete.birthdate;

        const beltCell = row.insertCell();
        beltCell.textContent = athlete.belt;

        const classeCell = row.insertCell();
        classeCell.textContent = athlete.classe;

        const specialtyCell = row.insertCell();
        specialtyCell.textContent = athlete.specialty;
        const weightCategoryCell = row.insertCell();
        weightCategoryCell.textContent = athlete.weight_category || ''; // Gestisci il caso in cui è nullo

        const societyCell = row.insertCell();
        //societyCell.textContent = societyName;
        societyCell.textContent = societyId; // Mostra l'ID della società (potresti voler mostrare il nome se necessario)

        const actionsCell = row.insertCell();
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Rimuovi';
        removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
        removeButton.addEventListener('click', () => removeAthlete(athlete.id, row));
        actionsCell.appendChild(removeButton);
        // Pulisci il form
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        document.querySelector('input[name="gender"]:checked').checked = false;
        document.getElementById("birthdate").value = "";
        document.getElementById("belt").value = "";
        document.getElementById("classe").value = "";
        document.getElementById("specialty").value = "";
        document.getElementById("weightCategory").value = "";
        // Opzionalmente, resetta le selezioni di categoria di peso e cintura
        toggleWeightCategory();
        updateBeltOptions();
    }
};

async function fetchAthletes() {
    const athleteList = document.getElementById('athleteList');
    athleteList.innerHTML = '';
    // Pulisci la tabella corrente

    const user = await supabase.auth.getUser();
    if (!user.data ?.user ?.id) {
        console.log("Utente non loggato.");
        return;
    }

    // Recupera l'ID della società per l'utente loggato
    const {
        data: societyData,
        error: societyError
    } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();
    if (societyError) {
        console.error('Errore nel recupero della società:', societyError.message);
        return;
    }

    if (!societyData) {
        console.log("Nessuna società trovata per questo utente.");
        return;
    }

    const societyId = societyData.id;

    const {
        data: athletesData,
        error: athletesError
    } = await supabase  
        .from('atleti')
       .select('*')
       .eq('society_id', societyId);
    if (athletesError) {
        console.error('Errore nel recupero degli atleti:', athletesError.message);
        return;
    }

    if (athletesData) {
        athletesData.forEach(athlete => {
            addAthleteToTable(athlete);
        });
    }

    // Aggiorna i contatori per Kumite e Kata
    await updateAthleteCountDisplay("Kumite");
    await updateAthleteCountDisplay("Kata");
}

async function removeAthlete(athleteId, rowToRemove) {
    if (confirm('Sei sicuro di voler rimuovere questo atleta?')) {
        const {
            error
        } = await supabase
            .from('atleti')
            .delete()
            .eq('id', athleteId);
        if (error) {
            console.error('Errore durante la rimozione dell\'atleta:', error.message);
            alert('Errore durante la rimozione dell\'atleta.');
        } else {
            alert('Atleta rimosso con successo!');
            // Rimuovi la riga dalla tabella HTML
            rowToRemove.remove();
            // Aggiorna i contatori dopo la rimozione
            const specialtyToRemove = rowToRemove.cells[6].textContent; // Ottieni la specialità dalla riga
            updateAthleteCountDisplay(specialtyToRemove);
        }
    }
}

     function toggleWeightCategory() {
const specialty = document.getElementById("specialty").value;
const gender = document.querySelector('input[name="gender"]:checked').value;
const weightCategoryField = document.getElementById("weightCategory");
if (specialty === "Kumite" && classe === "Esordienti") {
     // Abilita la selezione delle categorie di peso in base al genere
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

      if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-40">-40</option>
             <option value="-45">-45</option>
             <option value="-50">-50</option>
             <option value="-55">-55</option>
             <option value="+55">+55</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-42">-42</option>
             <option value="-47">-47</option>
             <option value="-52">-52</option>
             <option value="+52">+52</option>
         `;
     }
} else if (specialty === "Kumite" && classe === "Cadetti") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-47">-47</option>
<option value="-52">-52</option>
             <option value="-57">-57</option>
             <option value="-63">-63</option>
             <option value="-70">-70</option>
<option value="-78">-78</option>
             <option value="+78">+78</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-42">-42</option>
             <option value="-47">-47</option>
             <option value="-54">-54</option>
             <option value="-61">-61</option>
             <option value="-68">-68</option>
             <option value="+68">+68</option>
         `;
     }
} else if (specialty === "Kumite" && classe === "Juniores") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-50">-50</option>
             <option value="-55">-55</option>
             <option value="-61">-61</option>
             <option value="-68">-68</option>
             <option value="-76">-76</option>
            <option value="-86">-86</option>
             <option value="+86">+86</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-48">-48</option>
             <option value="-53">-53</option>
             <option value="-59">-59</option>
             <option value="-66">-66</option>
            <option value="-74">-74</option>
             <option value="+74">+74</option>
         `;
     }
} else if (specialty === "Kumite" && classe === "Assoluti") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-60">-60</option>
             <option value="-67">-67</option>
             <option value="-75">-75</option>
             <option value="-84">-84</option>
             <option value="+84">+84</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-50">-50</option>
             <option value="-55">-55</option>
             <option value="-61">-61</option>
             <option value="-68">-68</option>
             <option value="+68">+68</option>
         `;
     }
} else if (specialty === "Kumite" && classe === "U21") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-60">-60</option>
             <option value="-67">-67</option>
             <option value="-75">-75</option>
             <option value="-84">-84</option>
             <option value="+84">+84</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-50">-50</option>
             <option value="-55">-55</option>
             <option value="-61">-61</option>
             <option value="-68">-68</option>
             <option value="+68">+68</option>
         `;
     }
 } else if (specialty === "Kumite" && classe === "Ragazzi") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-32">-32</option>
             <option value="-37">-37</option>
             <option value="-42">-42</option>
             <option value="-47">-47</option>
             <option value="+47">+47</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-32">-32</option>
             <option value="-37">-37</option>
             <option value="-42">-42</option>
             <option value="-47">-47</option>
             <option value="+47">+47</option>
         `;
     }
 } else if (specialty === "Kumite" && classe === "Fanciulli") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="-22">-22</option>
             <option value="-27">-27</option>
             <option value="-32">-32</option>
             <option value="-37">-37</option>
            <option value="+37">+37</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
             <option value="-22">-22</option>
             <option value="-27">-27</option>
             <option value="-32">-32</option>
             <option value="-37">-37</option>
            <option value="+37">+37</option>
         `;
     }
} else {
    weightCategoryField.setAttribute("disabled", "disabled");
    weightCategoryField.innerHTML = "";
}
updateBeltOptions();
}
function updateSpecialtyOptionsBasedOnBirthdate() {
const birthdateInput = document.getElementById("birthdate");
const specialtySelect = document.getElementById("specialty");
const birthYear = new Date(birthdateInput.value).getFullYear();

// Pulisci le opzioni esistenti
specialtySelect.innerHTML = "";

// Aggiungi le opzioni in base all'anno di nascita
if (birthYear >= 2018 && birthYear <= 2021) {
specialtySelect.innerHTML += `
<option value="Percorso-Kata">Percorso-Kata</option>
<option value="percorso-Palloncino">Percorso-Palloncino</option>
<option value="ParaKarate">ParaKarate</option>`;
} else if (birthYear >= 2008 && birthYear <= 2017) {
specialtySelect.innerHTML += `
<option value="Kata">Kata</option>
<option value="Kumite">Kumite</option>
<option value="ParaKarate">ParaKarate</option>`;
    } else if (birthYear >= 1959 && birthYear <= 2007) {
specialtySelect.innerHTML += `
<option value="ParaKarate">ParaKarate</option>`;
} else {
specialtySelect.innerHTML += `
   <option value="ERROR">ERROR</option>`;
}
}

     function updateBeltOptions() {
         const classe = document.getElementById("classe").value;
         const beltSelect = document.getElementById("belt");

         // Pulisci e reimposta le opzioni per la categoria di cintura
         beltSelect.innerHTML = "";

         if (classe === "Fanciulli" || classe === "Ragazzi") {
             // Se la classe è Fanciulli o Ragazzi, aggiungi le opzioni di cintura specifiche
             beltSelect.innerHTML += `
                  <option value="Gialla">Gialla</option>
                 <option value="Arancio-Verde">Arancio-Verde</option>
                 <option value="Blu-Marrone">Blu-Marrone</option>`;
         }else if (classe === "Juniores") {
             // Se la classe è Juniores, aggiungi le opzioni di cintura specifiche
             beltSelect.innerHTML += `
          <option value="Marrone-Nera">Marrone-Nera</option>`;
         }else if (classe === "Esordienti" || classe === "Cadetti") {
             // Se la classe è Juniores, aggiungi le opzioni di cintura specifiche
             beltSelect.innerHTML += `
                <option value="Gialla">Gialla</option>
                 <option value="Arancio-Verde">Arancio-Verde</option>
                 <option value="Blu-Marrone">Blu-Marrone</option>
             `;
         }else if (classe === "ERROR") {
             beltSelect.innerHTML += `
            <option value="ERROR">ERROR</option >
        `;
   }else if (classe === "Bambini") {
             beltSelect.innerHTML += `
                        <option value="Tutte le cinture"> Tutte le cinture </option >
             `;
     }else {
             // Altrimenti, aggiungi le opzioni di cintura standard
             beltSelect.innerHTML += `
            <option value="Tutte le cinture"> Tutte le cinture </option >
             `;
         }
     }
     document.getElementById("birthdate").addEventListener("change", function() {
         const birthdate = new Date(this.value);
         const birthYear = birthdate.getFullYear();
         const classeSelect = document.getElementById("classe");

          if (birthYear >= 2008 && birthYear <= 2009) {
             classe = "Juniores";
             classeSelect.innerHTML = `
                 <option value="Juniores">Juniores</option>
             `;
         } else if (birthYear >= 2010 && birthYear <= 2011) {
             classe = "Cadetti";
             classeSelect.innerHTML = `<option value="Cadetti">Cadetti</option>`;
         } else if (birthYear >= 2012 && birthYear <= 2013) {
             classe = "Esordienti";
             classeSelect.innerHTML = `<option value="Esordienti">Esordienti</option>`;
         } else if (birthYear >= 2014 && birthYear <= 2015) {
             classe = "Ragazzi";
             classeSelect.innerHTML = `<option value="Ragazzi">Ragazzi</option>`;
         } else if (birthYear >= 2016 && birthYear <= 2017) {
             classe = "Fanciulli";
             classeSelect.innerHTML = `<option value="Fanciulli">Fanciulli</option>`;
         } else if (birthYear >= 2018 && birthYear <= 2019) {
             classe = "Bambini U8";
             classeSelect.innerHTML = `<option value="Bambini_U8">Bambini_U8</option>`;
             } else if (birthYear >= 2020 && birthYear <= 2021) {
                  classe = "Bambini_U6";
                  classeSelect.innerHTML = `<option value="Bambini_U6">Bambini_U6</option>`;
             } else if (birthYear >= 1990 && birthYear <= 2007) {
                   classe = "Seniores";
                   classeSelect.innerHTML = `<option value="Seniores">Seniores</option>`;
         } else if (birthYear >= 2022) {
             classe = "ERROR";
             classeSelect.innerHTML = `<option value="ERROR">ERROR</option>`;
         } else if (birthYear <=1959) {
             classe = "ERROR";
             classeSelect.innerHTML = `<option value="ERROR">ERROR</option>`;
         } else {
             classe = "Master";
             classeSelect.innerHTML = `<option value="Master">Master</option>`;
         }

         toggleWeightCategory();
     });

     document.querySelectorAll('input[name="gender"]').forEach(function(radio) {
         radio.addEventListener("change", toggleWeightCategory);
     })
