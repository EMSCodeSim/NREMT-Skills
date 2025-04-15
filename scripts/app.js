// Function to fetch and display patient data
async function fetchPatientData() {
  try {
    // Fetch the JSON file
    const response = await fetch('./data/patients.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON data
    const data = await response.json();

    // Get the first patient from the array
    const patient = data.patients[0];

    // Update the HTML with patient data
    document.getElementById('chief-complaint').innerText = `Chief Complaint: ${patient.chiefComplaint}`;
    document.getElementById('vital-signs').innerText = `Vital Signs: 
      HR: ${patient.vitalSigns.heartRate}, 
      BP: ${patient.vitalSigns.bloodPressure}, 
      RR: ${patient.vitalSigns.respiratoryRate}, 
      O2: ${patient.vitalSigns.oxygenSaturation}`;
  } catch (error) {
    console.error('Error fetching patient data:', error);

    // Display error messages in the HTML
    document.getElementById('chief-complaint').innerText = 'Error loading patient data.';
    document.getElementById('vital-signs').innerText = '';
  }
}

// Call the function to fetch and display the patient data
fetchPatientData();
