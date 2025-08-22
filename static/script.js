document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screens = { home: document.getElementById('home-screen'), analyzing: document.getElementById('analyzing-screen'), results: document.getElementById('results-screen') };
    const buttons = { startScan: document.getElementById('start-scan-btn'), resultAction: document.getElementById('result-action-btn'), sampleBtns: document.querySelectorAll('.sample-btn') };
    const resultElements = { status: document.getElementById('result-status'), percentage: document.getElementById('result-percentage'), details: document.getElementById('result-details'), insightsReport: document.getElementById('ai-insights-report'), icon: document.querySelector('.result-icon') };
    const sampleStatus = document.getElementById('sample-status');
    
    // --- State & Config ---
    const API_URL = '/predict';
    let currentSampleData = null;
    const SAMPLES = {
        healthy:  { "acetone": 0.9, "isoprene": 0.15, "ethylbenzene": 0.09, "alkane_mix": 0.11 },
        diabetes: { "acetone": 6.2, "isoprene": 0.19, "ethylbenzene": 0.16, "alkane_mix": 0.18 },
        cancer:   { "acetone": 1.2, "isoprene": 0.85, "ethylbenzene": 0.75, "alkane_mix": 0.9 }
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
        
        buttons.sampleBtns.forEach(b => b.classList.remove('selected'));
        document.querySelector(`.sample-btn[data-sample="${sampleType}"]`).classList.add('selected');
        
        sampleStatus.textContent = `Loaded: ${sampleType.charAt(0).toUpperCase() + sampleType.slice(1)} Sample`;
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    async function startScan() {
        if (!currentSampleData) {
            alert("Please load a sample first.");
            return;
        }
        showScreen('analyzing');
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSampleData),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            // Simulate analysis time
            setTimeout(() => {
                displayResults(data);
            }, 2500);

        } catch (error) {
            console.error("Error fetching results:", error);
            // Simulate analysis time even on error
            setTimeout(() => {
                displayResults(null, true);
            }, 2500);
        }
    }

    function displayResults(data, error = false) {
        showScreen('results');
        const screen = screens.results;
        screen.className = 'screen active'; // Reset classes

        if (error) {
            screen.classList.add('yellow');
            resultElements.status.textContent = 'Error';
            resultElements.icon.textContent = '⚠️';
            resultElements.details.innerHTML = '';
            resultElements.percentage.textContent = '';
            resultElements.insightsReport.innerHTML = `<p>Could not connect to the AI server. Please ensure the backend is running correctly and that you have an internet connection.</p>`;
            buttons.resultAction.textContent = 'Try Again';
            buttons.resultAction.onclick = () => {
                window.location.reload();
            };
            return;
        }

        const prediction = data.prediction;
        const probabilities = data.probabilities;
        let resultClass = '';
        let status = '';
        let insightsHTML = '';
        
        if (prediction === 'Healthy') {
            resultClass = 'green';
            status = 'Healthy';
            resultElements.icon.textContent = '✓';
            resultElements.percentage.textContent = `Confidence: ${(probabilities.Healthy * 100).toFixed(0)}%`;
            insightsHTML = `<h4>AI Insights:</h4><p>Biomarker levels appear to be within normal ranges. Our model finds no significant risk factors based on this sample.</p>`;
        } else if (prediction === 'Diabetes') {
            resultClass = 'yellow';
            status = 'Diabetes Markers Detected';
            resultElements.icon.textContent = '⚠️';
            resultElements.percentage.textContent = `Confidence: ${(probabilities.Diabetes * 100).toFixed(0)}%`;
            insightsHTML = `<h4>AI Insights:</h4><p>The AI detected a significant spike in <b>Acetone</b>. In the clinical data used to train our model, this is a key biomarker for diabetic profiles.</p><p><b>Disclaimer:</b> This is not a diagnosis. We strongly recommend sharing these preliminary findings with a healthcare professional.</p>`;
        } else { // Lung Cancer
            resultClass = 'red';
            status = 'Cancer Markers Detected';
            resultElements.icon.textContent = '!!';
            resultElements.percentage.textContent = `Confidence: ${(probabilities['Lung Cancer'] * 100).toFixed(0)}%`;
            insightsHTML = `<h4>AI Insights:</h4><p>Our AI detected a pattern of elevated biomarkers, including <b>alkane_mix</b>. This signature is strongly correlated with lung cancer profiles in our training data.</p><p><b>Disclaimer:</b> This is not a diagnosis. We strongly recommend sharing these preliminary findings with a healthcare professional.</p>`;
        }
        
        buttons.resultAction.textContent = 'Run Another Test';
        buttons.resultAction.onclick = () => window.location.reload();

        screen.classList.add(resultClass);
        resultElements.status.textContent = status;
        resultElements.insightsReport.innerHTML = insightsHTML;
        resultElements.details.innerHTML = `
            <div class="detail-item"><span>Lung Cancer Profile</span> <span>${(probabilities['Lung Cancer'] * 100).toFixed(0)}%</span></div>
            <div class="detail-item"><span>Diabetes Profile</span> <span>${(probabilities.Diabetes * 100).toFixed(0)}%</span></div>
            <div class="detail-item"><span>Healthy Profile</span> <span>${(probabilities.Healthy * 100).toFixed(0)}%</span></div>
        `;
    }
});