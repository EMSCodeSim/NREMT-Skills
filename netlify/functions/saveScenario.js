const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Sanitize folder name
    const timestamp = Date.now();
    const complaint = (data.complaint || "scenario").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const folderName = `${complaint}_${timestamp}`;
    const scenarioPath = path.resolve(__dirname, `../../scenarios/${folderName}`);

    fs.mkdirSync(scenarioPath, { recursive: true });

    // Write scenario.json
    fs.writeFileSync(
      path.join(scenarioPath, "scenario.json"),
      JSON.stringify({
        type: data.type,
        complaint: data.complaint,
        dispatch: data.dispatch
      }, null, 2)
    );

    // Write vitals.json
    fs.writeFileSync(
      path.join(scenarioPath, "vitals.json"),
      JSON.stringify(data.vitals, null, 2)
    );

    // Write patient.json
    fs.writeFileSync(
      path.join(scenarioPath, "patient.json"),
      JSON.stringify(data.history, null, 2)
    );

    // Write proctor.json (media trigger)
    fs.writeFileSync(
      path.join(scenarioPath, "proctor.json"),
      JSON.stringify(data.media, null, 2)
    );

    // Also write latest.json for the homepage loader
    fs.writeFileSync(
      path.resolve(__dirname, "../../scenarios/latest.json"),
      JSON.stringify({
        dispatch: data.dispatch,
        vitals: data.vitals,
        history: data.history,
        media: data.media
      }, null, 2)
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Scenario saved: ${folderName}` })
    };
  } catch (err) {
    console.error("Error saving scenario:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save scenario." })
    };
  }
};
