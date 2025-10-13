// La variabile 'supabase' DEVE essere definita e inizializzata nel tuo ambiente HTML/JS.
// Esempio (non incluso qui, deve essere nel tuo file HTML/config):
// const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//================================================================================
// 1. GESTIONE LIMITI MASSIMI E CONTEGGIO UNIFICATO KIDS
//================================================================================

// Funzione per ottenere il limite massimo di atleti per specialità
function getMaxAthletesForSpecialty(specialty) {
    if (specialty === "Kumite") {
        return 600;
    } else if (specialty === "Kata") {
        return 500;
    } else if (specialty === "ParaKarate") {
        return 50;
    } 
    // Limite unificato per le specialità Percorso
    else if (specialty === "percorso-Palloncino" || specialty === "Percorso-Kata") {
        return 600; 
    } else {
        return Infinity;
    }
}

// Funzione per ottenere il conteggio totale degli atleti KIDS (unificato per Palloncino e Kata)
async function getKidsCount() {
    const specialtyList = ["Percorso-Palloncino", "Percorso-Kata"];
    
    const { 
        count, 
        error 
    } = await supabase
        .from('atleti')
        .select('*', { 
            count: 'exact', 
            head: true 
        })
        .in('specialty', specialtyList); // Usa .in() per contare entrambe le specialità

    if (error) {
        console.error("Errore nel conteggio atleti KIDS:", error.message);
        return { count: 0, error: error };
    }
    return { count: count || 0, error: null };
}

// Funzione per aggiornare il contatore visualizzato
async function updateAthleteCountDisplay(specialty) {
    let currentCount = 0;
    let maxAthletes = getMaxAthletesForSpecialty(specialty);
    let counterElementId = '';
    
    // Logica per le specialità unificate KIDS
    if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata") {
        const result = await getKidsCount();
        if (result.error) return;
        currentCount = result.count;
        counterElementId = 'KIDSAthleteCountDisplay';
    } 
    // Logica per le specialità singole
    else {
        // Mappatura per l'ID HTML
        counterElementId = (specialty === "Kumite") ? 'kumiteAthleteCountDisplay' : 
                           (specialty === "Kata") ? 'kataAthleteCountDisplay' : 
                           (specialty === "ParaKarate") ? 'ParaKarateAthleteCountDisplay' : '';

        // Query per il conteggio standard
        const { 
            count, 
            error: countError 
        } = await supabase
            .from('atleti')
            .select('*', { 
                count: 'exact', 
                head: true 
            })
            .eq('specialty', specialty);

        if (countError) {
            console.error(`Errore nel conteggio degli atleti per ${specialty}:`, countError.message);
            return;
        }
        currentCount = count || 0;
    }

    const remainingSlots = maxAthletes - currentCount;

    const counterElement = document.getElementById(counterElementId);
    if (counterElement) {
        // Visualizza il conteggio corretto, usando 'KIDS' se unificato
        const displaySpecialty = (counterElementId === 'KIDSAthleteCountDisplay') ? 'KIDS' : specialty;
        counterElement.textContent = `Posti disponibili per ${displaySpecialty}: ${remainingSlots} / ${maxAthletes}`;
    }
}

// Funzione per chiamare l'aggiornamento di tutti i contatori rilevanti
async function updateAllCounters() {
    await updateAthleteCountDisplay("Kumite");
    await updateAthleteCountDisplay("Kata");
    await updateAthleteCountDisplay("ParaKarate");
    // Aggiorna il contatore KIDS chiamando una delle due specialità
    await updateAthleteCountDisplay("Percorso-Kata"); 
}


//================================================================================
// 2. LOGICA DI INSERIMENTO ATLETA (ADD ATHLETE)
//================================================================================

function addAthleteToTable(athlete) {
    // ... (Mantieni invariata la logica di visualizzazione della riga)
    const athleteList = document.getElementById('athleteList');
    const row = athleteList.insertRow();

    const nameCell = row.insertCell(); nameCell.textContent = athlete.first_name;
    const lastNameCell = row.insertCell(); lastNameCell.textContent = athlete.last_name;
    const genderCell = row.insertCell(); genderCell.textContent = athlete.gender;
    const birthdateCell = row.insertCell(); birthdateCell.textContent = athlete.birthdate;
    const beltCell = row.insertCell(); beltCell.textContent = athlete.belt;
    const classeCell = row.insertCell(); classeCell.textContent = athlete.classe;

    const specialtyCell = row.insertCell(); specialtyCell.textContent = athlete.specialty; // Indice 6
    
    const weightCategoryCell = row.insertCell(); weightCategoryCell.textContent = athlete.weight_category || '';
    const societyCell = row.insertCell(); societyCell.textContent = athlete.society_id;

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

    if (!firstName || !lastName || !gender || !gender.checked || !birthdate || !classe || !specialty || !belt || !societyName) {
        alert("Mancano campi obbligatori.");
        return;
    }

    const { data: societyData, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('nome', societyName)
        .single();

    if (societyError) {
        alert('Società non trovata o errore di accesso.');
        return;
    }

    const societyId = societyData.id;

    const maxAthletes = getMaxAthletesForSpecialty(specialty);
    let currentCount = 0;
    
    // ⭐️ LOGICA DI PRE-VERIFICA DEL LIMITE AGGIORNATA
    if (specialty === "Percorso-Palloncino" || specialty === "Percorso-Kata") {
        // Usa il conteggio unificato per i percorsi
        const result = await getKidsCount();
        if (result.error) return;
        currentCount = result.count;
    } else {
        // Usa il conteggio standard per le altre specialità
        const { count, error: countError } = await supabase
            .from('atleti')
            .select('*', { count: 'exact', head: true }) 
            .eq('specialty', specialty);
            
        if (countError) {
            console.error('Errore nel conteggio degli atleti:', countError.message);
            alert('Errore interno del server.');
            return;
        }
        currentCount = count || 0;
    }
    
    // Controllo del limite
    if (currentCount >= maxAthletes) {
        alert(`Siamo spiacenti, il numero massimo di iscritti alla categoria ${specialty} (limite: ${maxAthletes}) è stato raggiunto.`);
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
            society_id: societyId
        }]).select();

    if (error) {
        console.error('Errore aggiunta atleta:', error.message);
        alert('Errore durante l\'aggiunta dell\'atleta.');
    } else if (newAthlete && newAthlete.length > 0) {
        alert('Atleta aggiunto con successo!');
        addAthleteToTable(newAthlete[0]); 

        // ⭐️ AGGIORNA TUTTI I CONTATORI RELEVANTI
        await updateAllCounters();
        
        // Pulisci il form (lascio le pulizie parziali come nel tuo codice)
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        // Assumi che tu abbia la logica per pulire tutti i campi
    }
}


//================================================================================
// 3. RECUPERO E RIMOZIONE (FETCH & REMOVE)
//================================================================================

async function fetchAthletes() {
    // ... (Mantieni invariata la logica di autenticazione e recupero atleti per società)
    const athleteList = document.getElementById('athleteList');
    athleteList.innerHTML = ''; 

    const user = await supabase.auth.getUser();
    if (!user.data ?.user ?.id) {
        console.log("Utente non loggato.");
        return;
    }

    const { data: societyData, error: societyError } = await supabase
        .from('societa')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();
        
    if (societyError || !societyData) {
        console.error('Nessuna società trovata per questo utente o errore:', societyError?.message);
        return;
    }

    const societyId = societyData.id;

    const { data: athletesData, error: athletesError } = await supabase  
       .from('atleti')
       .select('*')
       .eq('society_id', societyId);
       
    if (athletesError) {
        console.error('Errore nel recupero degli atleti:', athletesError.message);
        return;
    }

    if (athletesData) {
        athletesData.forEach(athlete => addAthleteToTable(athlete));
    }

    // ⭐️ AGGIORNA TUTTI I CONTATORI AL CARICAMENTO DELLA PAGINA
    await updateAllCounters();
}

async function removeAthlete(athleteId, rowToRemove) {
    if (confirm('Sei sicuro di voler rimuovere questo atleta?')) {
        const specialtyToRemove = rowToRemove.cells[6].textContent; // Indice della cella specialità
        
        const { error } = await supabase
            .from('atleti')
            .delete()
            .eq('id', athleteId);
            
        if (error) {
            console.error('Errore durante la rimozione dell\'atleta:', error.message);
            alert('Errore durante la rimozione dell\'atleta.');
        } else {
            alert('Atleta rimosso con successo!');
            rowToRemove.remove();
            
            // ⭐️ AGGIORNA TUTTI I CONTATORI DOPO LA RIMOZIONE
            await updateAllCounters();
        }
    }
}


//================================================================================
// 4. ESECUZIONE (Inizializzazione)
//================================================================================

// Chiama fetchAthletes all'avvio per popolare la tabella e i contatori
document.addEventListener('DOMContentLoaded', fetchAthletes);



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
