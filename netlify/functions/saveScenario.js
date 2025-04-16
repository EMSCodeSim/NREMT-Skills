const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const scenarioId = data.id || "scenario_" + Date.now();
    const baseDir = path.resolve(__dirname, `../../scenarios/${scenarioId}`);

    fs.mkdirSync(baseDir, { recursive: true });

    // Write core scenario.json
    fs.writeFileSync(path.join(baseDir, "scenario.json"), JSON.stringify({
      id: scenarioId,
      type: data.type,
      dispatch: data.dispatch
    }, null, 2));

    // Write vitals.json
    fs.writeFileSync(path.join(baseDir, "vitals.json"), JSON.stringify(data.vitals, null, 2));

    // Write patient.json
    fs.writeFileSync(path.join(baseDir, "patient.json"), JSON.stringify({
      medicalHistory: data.history.pastMedicalHistory,
      medications: data.history.medications,
      allergies: data.history.allergies
    }, null, 2));

    // Save proctor.json if trigger/media provided
    fs.writeFileSync(path.join(baseDir, "proctor.json"), JSON.stringify({
      mediaTrigger: data.media.trigger,
      mediaFilename: data.media.filename
    }, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Scenario saved to folder: " + scenarioId })
    };

  } catch (err) {
    console.error("Save scenario error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save scenario" })
    };
  }
};
