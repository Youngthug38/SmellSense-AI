document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screens = { home: document.getElementById('home-screen'), analyzing: document.getElementById('analyzing-screen'), results: document.getElementById('results-screen') };
    const buttons = { startScan: document.getElementById('start-scan-btn'), resultAction: document.getElementById('result-action-btn'), sampleBtns: document.querySelectorAll('.sample-btn') };
    const resultElements = { status: document.getElementById('result-status'), percentage: document.getElementById('result-percentage'), details: document.getElementById('result-details'), insightsReport: document.getElementById('ai-insights-report') };
    const sampleStatus = document.getElementById('sample-status');
    
    // --- State & Config ---
    const API_URL = 'http://127.0.0.1:5000/predict';
    let currentSampleData = null;
    const SAMPLES = {
        healthy: { "acetone": 0.9, "isoprene": 0.15, "ethylbenzene": 0.09, "alkane_mix": 0.11 },
        diabetes: { "acetone": 6.2, "isoprene": 0.19, "ethylbenzene": 0.16, "alkane_mix": 0.18 },
        cancer: { "acetone": 1.2, "isoprene": 0.85, "ethylbenzene": 0.75, "alkane_mix": 0.9 }
    };

    // --- Event Listeners ---
    buttons.startScan.addEventListener('click', startScan);
    buttons.sampleBtns.forEach(btn => {
        btn.addEventListener('click', () => loadSample(btn.dataset.sample));
    });

    // --- Functions ---
    function loadSample(sampleType) {
        currentSampleData = SAMPLES[sampleType];
        buttons.startScan.disabled = false;
        
        // Visual feedback for selected button
        buttons.sampleBtns.forEach(b => b.classList.remove('selected'));
        document.querySelector(`.sample-btn[data-sample="${sampleType}"]`).classList.add('selected');
        
        sampleStatus.textContent = `Loaded: ${sampleType.charAt(0).toUpperCase() + sampleType.slice(1)} Sample`;
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    function startScan() {
        if (!currentSampleData) {
            alert("Please load a sample first.");
            return;
        }
        showScreen('analyzing');
        setTimeout(fetchResults, 2500); 
    }

    async function fetchResults() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSampleData),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            displayResults(data.predictions);
        } catch (error) {
            console.error("Error fetching results:", error);
            displayResults(null, true);
        }
    }

    function displayResults(predictions, error = false) {
        showScreen('results');
        const screen = screens.results;
        screen.className = 'screen active';

        if (error) {
            screen.classList.add('yellow');
            resultElements.status.textContent = 'Error';
            resultElements.insightsReport.innerHTML = "Could not connect to the AI server. Please ensure the backend is running and try again.";
            return;
        }

        const { Healthy, Diabetes, 'Lung Cancer': LungCancer } = predictions;
        let resultClass = '';
        let status = '';
        let insightsHTML = '';
        
        // Determine the highest prediction
        const maxProb = Math.max(Healthy, Diabetes, LungCancer);

        if (maxProb === Healthy) {
            resultClass = 'green';
            status = 'Healthy';
            resultElements.percentage.textContent = `${(Healthy * 100).toFixed(0)}% Likelihood`;
            insightsHTML = `<h4>AI-Powered Insights:</h4><p>Biomarker levels appear to be within normal ranges. Our model finds no significant risk factors based on this sample.</p>`;
            buttons.resultAction.textContent = 'Run Another Test';
            buttons.resultAction.onclick = () => showScreen('home');
        } else if (maxProb === Diabetes) {
            resultClass = 'yellow';
            status = 'Moderate Risk';
            resultElements.percentage.textContent = `Potential Diabetes Profile`;
            insightsHTML = `<h4>AI-Powered Insights:</h4><p>The AI detected a significant spike in <b>Acetone</b> levels. In the clinical data used to train our model, this is a key biomarker for diabetic profiles.</p><p><b>Disclaimer:</b> This is not a diagnosis. We strongly recommend sharing these preliminary findings with a healthcare professional.</p>`;
            buttons.resultAction.textContent = 'Consult a Healthcare Provider';
            buttons.resultAction.onclick = () => alert('Connecting to telehealth services...');
        } else { // Lung Cancer
            resultClass = 'red';
            status = 'High Risk';
            resultElements.percentage.textContent = `Potential Lung Cancer Profile`;
            insightsHTML = `<h4>AI-Powered Insights:</h4><p>Our AI detected a pattern of elevated biomarkers, including <b>Isoprene</b> and <b>Ethylbenzene</b>. In the clinical data used to train our model, this signature is strongly correlated with lung cancer profiles.</p><p><b>Disclaimer:</b> This is not a diagnosis. We strongly recommend sharing these preliminary findings with a healthcare professional.</p>`;
            buttons.resultAction.textContent = 'Consult a Healthcare Provider';
            buttons.resultAction.onclick = () => alert('Connecting to telehealth services...');
        }
        
        screen.classList.add(resultClass);
        resultElements.status.textContent = status;
        resultElements.insightsReport.innerHTML = insightsHTML;
        resultElements.details.innerHTML = `
            <div class="detail-item"><span>Lung Cancer Profile</span> <span>${(LungCancer * 100).toFixed(0)}%</span></div>
            <div class="detail-item"><span>Diabetes Profile</span> <span>${(Diabetes * 100).toFixed(0)}%</span></div>
            <div class="detail-item"><span>Healthy Profile</span> <span>${(Healthy * 100).toFixed(0)}%</span></div>
        `;
    }
});