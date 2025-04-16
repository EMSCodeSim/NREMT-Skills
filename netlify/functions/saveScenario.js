<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scenario Builder</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: auto; }
    label { display: block; margin-top: 10px; font-weight: bold; }
    input, textarea, select, button { width: 100%; padding: 8px; margin-top: 5px; }
    .inline { display: flex; gap: 10px; }
    .inline input, .inline select { flex: 1; }
    hr { margin: 30px 0; }
  </style>
</head>
<body>

  <h1>🛠️ EMS Scenario Builder</h1>

  <!-- Scenario Category -->
  <div style="text-align: center; margin-bottom: 20px;">
    <button onclick="setType('medical')">🩺 Medical</button>
    <button onclick="setType('trauma')">🩸 Trauma</button>
    <a href="index.html"><button>🔙 Return to Simulator</button></a>
  </div>

  <!-- Scenario Type & Complaint -->
  <label for="chiefComplaint">Chief Complaint:</label>
  <select id="chiefComplaint">
    <option value="">-- Select --</option>
  </select>

  <!-- Dispatch Info -->
  <label for="dispatch">Dispatch Info:</label>
  <textarea id="dispatch" rows="3"></textarea>
  <button onclick="autoGenerate('dispatch')">Auto Generate Dispatch</button>

  <hr>

  <!-- Vitals -->
  <h2>Vitals</h2>
  <div class="inline">
    <input id="bp" placeholder="Blood Pressure" />
    <input id="pulse" placeholder="Pulse" />
  </div>
  <div class="inline">
    <input id="rr" placeholder="Respirations" />
    <input id="spo2" placeholder="SpO2" />
  </div>
  <div class="inline">
    <input id="pupils" placeholder="Pupils" />
    <input id="skin" placeholder="Skin" />
  </div>
  <button onclick="autoGenerate('vitals')">Auto Generate Vitals</button>

  <hr>

  <!-- History -->
  <label for="history">Medical History:</label>
  <textarea id="history" rows="2"></textarea>
  <button onclick="autoGenerate('history')">Auto Generate History</button>

  <label for="meds">Medications:</label>
  <input id="meds" />
  <button onclick="autoGenerate('meds')">Auto Generate Meds</button>

  <label for="allergies">Allergies:</label>
  <input id="allergies" />
  <button onclick="autoGenerate('allergies')">Auto Generate Allergies</button>

  <hr>

  <!-- Media Upload -->
  <h2>Media Upload</h2>
  <input type="file" id="mediaFile" />
  <input id="trigger" placeholder="When should media display?" />

  <hr>
  <button onclick="saveScenario()">💾 Save Scenario</button>
  <pre id="output" style="background:#f4f4f4; padding:10px;"></pre>

  <script>
    const categories = {
      medical: ["Chest Pain", "Shortness of Breath", "Altered Mental Status", "Seizure", "Custom"],
      trauma: ["Fall", "MVC", "Gunshot Wound", "Burn", "Custom"]
    };

    let selectedType = "";

    function setType(type) {
      selectedType = type;
      const complaintList = categories[type];
      const select = document.getElementById("chiefComplaint");
      select.innerHTML = '<option value="">-- Select --</option>';
      complaintList.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.toLowerCase();
        opt.text = item;
        select.appendChild(opt);
      });
    }

    function autoGenerate(field) {
      const complaint = document.getElementById("chiefComplaint").value;

      const data = {
        "chest pain": {
          dispatch: "Dispatched to a 55-year-old male with chest pain.",
          vitals: ["142/90", "98", "20", "95", "Equal, reactive", "Cool, clammy"],
          history: "HTN, high cholesterol",
          meds: "Nitro, Aspirin",
          allergies: "Penicillin"
        },
        "shortness of breath": {
          dispatch: "Dispatched for 67-year-old female with difficulty breathing.",
          vitals: ["130/84", "105", "28", "88", "Equal", "Cyanotic, moist"],
          history: "COPD, smoking",
          meds: "Albuterol, Prednisone",
          allergies: "None"
        },
        "altered mental status": {
          dispatch: "Call for unresponsive male found by family on couch.",
          vitals: ["110/70", "78", "12", "93", "Sluggish", "Warm, dry"],
          history: "Diabetes, recent stroke",
          meds: "Metformin, Lisinopril",
          allergies: "None"
        },
        "fall": {
          dispatch: "Fall from ladder, 62-year-old male, conscious.",
          vitals: ["136/82", "88", "18", "96", "Equal", "Bruised, alert"],
          history: "Osteoporosis",
          meds: "Calcium, ASA",
          allergies: "None"
        },
        "mvc": {
          dispatch: "MVC with airbag deployment, 25-year-old female.",
          vitals: ["124/78", "112", "22", "97", "Equal", "Anxious, diaphoretic"],
          history: "None",
          meds: "None",
          allergies: "None"
        }
      };

      const entry = data[complaint];
      if (!entry) return;

      switch (field) {
        case "dispatch":
          document.getElementById("dispatch").value = entry.dispatch;
          break;
        case "vitals":
          const [bp, pulse, rr, spo2, pupils, skin] = entry.vitals;
          document.getElementById("bp").value = bp;
          document.getElementById("pulse").value = pulse;
          document.getElementById("rr").value = rr;
          document.getElementById("spo2").value = spo2;
          document.getElementById("pupils").value = pupils;
          document.getElementById("skin").value = skin;
          break;
        case "history":
          document.getElementById("history").value = entry.history;
          break;
        case "meds":
          document.getElementById("meds").value = entry.meds;
          break;
        case "allergies":
          document.getElementById("allergies").value = entry.allergies;
          break;
      }
    }

    function saveScenario() {
      const scenario = {
        type: selectedType,
        complaint: document.getElementById("chiefComplaint").value,
        dispatch: document.getElementById("dispatch").value,
        vitals: {
          bloodPressure: document.getElementById("bp").value,
          pulse: document.getElementById("pulse").value,
          respirations: document.getElementById("rr").value,
          spo2: document.getElementById("spo2").value,
          pupils: document.getElementById("pupils").value,
          skin: document.getElementById("skin").value
        },
        history: {
          pastMedicalHistory: document.getElementById("history").value,
          medications: document.getElementById("meds").value,
          allergies: document.getElementById("allergies").value
        },
        media: {
          filename: document.getElementById("mediaFile").files[0]?.name || "",
          trigger: document.getElementById("trigger").value
        }
      };

      fetch("/.netlify/functions/saveScenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario)
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById("output").textContent = "✅ " + data.message;
      })
      .catch(err => {
        document.getElementById("output").textContent = "❌ Error saving scenario.";
      });
    }
  </script>
</body>
</html>
