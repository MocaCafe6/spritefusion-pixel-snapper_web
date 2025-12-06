import init, { process_image } from './pkg/spritefusion_pixel_snapper.js';

// Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('result-area');
const originalImg = document.getElementById('original-img');
const processedImg = document.getElementById('processed-img');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');
const colorInput = document.getElementById('color-input');

let wasmLoaded = false;

// Initialize WASM
async function run() {
    try {
        await init();
        wasmLoaded = true;
        console.log("WASM loaded successfully");
    } catch (e) {
        console.error("Failed to load WASM:", e);
        alert("Failed to initialize the tool. Please reload.");
    }
}

run();

// Drag & Drop Handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!wasmLoaded) return;
    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    // Reset UI
    dropZone.classList.add('hidden');
    resultArea.classList.add('hidden');
    loading.classList.remove('hidden');

    // Show preview of original
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImg.src = e.target.result;

        // Convert to ArrayBuffer for WASM
        const arrayReader = new FileReader();
        arrayReader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            processWithWasm(bytes);
        };
        arrayReader.readAsArrayBuffer(file);
    };
    reader.readAsDataURL(file);
}

function processWithWasm(bytes) {
    try {
        // Run specific WASM function
        // Run specific WASM function
        let kColors = undefined;
        if (colorInput.value) {
            const val = parseInt(colorInput.value);
            if (val > 0) kColors = val;
        }

        // Note: process_image in main.rs returns Result<Vec<u8>, JsValue>
        const outputBytes = kColors ? process_image(bytes, kColors) : process_image(bytes);

        // Convert Output Bytes to Blob URL
        const blob = new Blob([outputBytes], { type: 'image/png' });
        const url = URL.createObjectURL(blob);

        processedImg.src = url;
        downloadLink.href = url;

        // Show Results
        loading.classList.add('hidden');
        resultArea.classList.remove('hidden');

    } catch (err) {
        console.error("Processing error:", err);
        alert("Error processing image: " + err);
        loading.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }
}

// Reset Handler
resetBtn.addEventListener('click', () => {
    resultArea.classList.add('hidden');
    dropZone.classList.remove('hidden');
    fileInput.value = '';
    colorInput.value = '';
    processedImg.src = '';
    originalImg.src = '';
});
