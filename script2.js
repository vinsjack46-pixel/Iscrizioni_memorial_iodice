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
         `; }
     } else if (specialty === "ParaKarate") {
     // Aggiungi le categorie di peso per i senior maschili e femminili
     weightCategoryField.removeAttribute("disabled");
     weightCategoryField.innerHTML = "";

     if (gender === "Maschio") {
         weightCategoryField.innerHTML += `
             <option value="K20">K 20</option>
             <option value="K21">K 21</option>
             <option value="K22">K 22</option>
             <option value="K30">K 30</option>
            <option value="K31">K 31</option>
            <option value="K32">K 32</option>
             <option value="K33">K 33</option>
             <option value="K34">K 34</option>
            <option value="K35">K 35</option>
               <option value="K36">K 36</option>
             <option value="K40">K 40</option>
         `;
     } else if (gender === "Femmina") {
         weightCategoryField.innerHTML += `
           <option value="K20">K 20</option>
             <option value="K21">K 21</option>
             <option value="K22">K 22</option>
             <option value="K30">K 30</option>
            <option value="K31">K 31</option>
            <option value="K32">K 32</option>
             <option value="K33">K 33</option>
             <option value="K34">K 34</option>
            <option value="K35">K 35</option>
               <option value="K36">K 36</option>
             <option value="K40">K 40</option>
         `;  }
     }else {
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
<option value="Percorso-Palloncino">Percorso-Palloncino</option>
<option value="ParaKarate">ParaKarate</option>`;
} else if (birthYear >= 2016 && birthYear <= 2017) {
specialtySelect.innerHTML += `
<option value="Kata">Kata</option>
<option value="Kumite">Kumite</option>
<option value="Palloncino">Palloncino</option>
<option value="ParaKarate">ParaKarate</option>`;
} else if (birthYear >= 2008 && birthYear <= 2015) {
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
         }else if (classe === "Esordienti") {
             // Se la classe è Juniores, aggiungi le opzioni di cintura specifiche
             beltSelect.innerHTML += `
             <option value="Gialla">Gialla</option>
                <option value="Arancio-Verde">Arancio-Verde</option>
                 <option value="Blu-Marrone">Blu-Marrone</option>
             `;
             }else if (classe === "Cadetti") {
             // Se la classe è Juniores, aggiungi le opzioni di cintura specifiche
             beltSelect.innerHTML += `
             <option value="Gialla">Gialla</option>
                 <option value="Arancio-Verde">Arancio-Verde</option>
                 <option value="Blu-Marrone-Nera">Blu-Marrone-Nera</option>
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
