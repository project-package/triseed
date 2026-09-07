
// ============================================================
// CornVision AI - Gemini Vision Analysis
// ============================================================

// IMPORTANT:
// For testing only, paste your Gemini API key below.
// Do NOT expose this key in a public production website.
// const GEMINI_API_KEY = "AIzaSyBAWR5fbU_6DmNDhy-3u3RBgiD3tIakLLw";

// You can change this model if needed.
// const GEMINI_MODEL = "gemini-3.5-flash";

// $apiKey = 'AQ.Ab8RN6LkkqQGaVk0bh5gzJWmtC9i0C3sDGDJKQfVOHcdv-WntQ';
// $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

let currentImageFile = null;
let currentImagePreview = null;
let batchQueue = [];


// ============================================================
// INITIALIZE PAGE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initUploadTab();
    initBatchTab();
    initTabs();
});


// ============================================================
// TABS
// ============================================================

function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");

            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });

            const targetTab = document.getElementById(`${tabId}Tab`);

            if (targetTab) {
                targetTab.classList.add("active");
            }
        });
    });
}


// ============================================================
// UPLOAD TAB
// ============================================================

function initUploadTab() {

    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("imageInput");
    const selectBtn = document.getElementById("selectFileBtn");
    const runBtn = document.getElementById("runAnalysisBtn");
    const previewContainer = document.getElementById("imagePreview");
    const resultsArea = document.getElementById("analysisResults");

    if (!uploadZone) return;


    // --------------------------------------------------------
    // HANDLE FILE
    // --------------------------------------------------------

    function handleFile(file) {

        if (!file) return;

        // Validate image
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }

        // Limit 10 MB
        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be smaller than 10 MB.");
            return;
        }

        currentImageFile = file;

        const reader = new FileReader();

        reader.onload = (e) => {

            currentImagePreview = e.target.result;

            previewContainer.innerHTML = `
                <img
                    src="${currentImagePreview}"
                    alt="Corn seed preview"
                    class="preview-img"
                >

                <button class="remove-image-btn">
                    <i class="fas fa-times"></i>
                    Remove
                </button>
            `;

            previewContainer.classList.remove("hidden");

            if (runBtn) {
                runBtn.disabled = false;
            }


            // REMOVE IMAGE

            const removeBtn =
                previewContainer.querySelector(".remove-image-btn");

            if (removeBtn) {

                removeBtn.addEventListener("click", () => {

                    currentImageFile = null;
                    currentImagePreview = null;

                    previewContainer.innerHTML = "";

                    previewContainer.classList.add("hidden");

                    if (runBtn) {
                        runBtn.disabled = true;
                    }

                    resultsArea.innerHTML = `
                        <div class="placeholder-results">
                            <i class="fas fa-camera-retro"></i>
                            <p>Upload an image to start analysis</p>
                        </div>
                    `;
                });
            }
        };

        reader.readAsDataURL(file);
    }


    // --------------------------------------------------------
    // FILE INPUT
    // --------------------------------------------------------

    uploadZone.addEventListener("click", () => {
        fileInput.click();
    });


    fileInput.addEventListener("change", e => {

        if (e.target.files[0]) {

            handleFile(e.target.files[0]);
        }
    });


    selectBtn.addEventListener("click", e => {

        e.stopPropagation();

        fileInput.click();
    });


    // --------------------------------------------------------
    // DRAG AND DROP
    // --------------------------------------------------------

    uploadZone.addEventListener("dragover", e => {

        e.preventDefault();

        uploadZone.classList.add("drag-over");
    });


    uploadZone.addEventListener("dragleave", () => {

        uploadZone.classList.remove("drag-over");
    });


    uploadZone.addEventListener("drop", e => {

        e.preventDefault();

        uploadZone.classList.remove("drag-over");

        if (e.dataTransfer.files[0]) {

            handleFile(e.dataTransfer.files[0]);
        }
    });


    // --------------------------------------------------------
    // RUN GEMINI ANALYSIS
    // --------------------------------------------------------

    if (runBtn) {

        runBtn.addEventListener("click", async () => {

            if (!currentImageFile) return;


            // Check API key

            if (
                !GEMINI_API_KEY ||
                GEMINI_API_KEY ===
                    "PASTE_YOUR_GEMINI_API_KEY_HERE"
            ) {

                resultsArea.innerHTML = `
                    <div class="placeholder-results">
                        <i class="fas fa-key"></i>

                        <p>
                            Please add your Gemini API key
                            in analyze.js
                        </p>
                    </div>
                `;

                return;
            }


            // Disable button

            runBtn.disabled = true;

            runBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Analyzing with Gemini AI...
            `;


            // Loading UI

            resultsArea.innerHTML = `
                <div class="analysis-loading">

                    <i class="fas fa-brain"></i>

                    <p>
                        Gemini AI is analyzing the corn seed image...
                    </p>

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width: 70%"
                        ></div>

                    </div>

                </div>
            `;


            try {

                // --------------------------------------------
                // CALL GEMINI
                // --------------------------------------------

                const result =
                    await analyzeWithGemini(currentImageFile);


                // Save to history

                const user = getCurrentUser();

                if (user) {

                    const history =
                        Storage.get(
                            `history_${user.username}`
                        ) || [];


                    history.unshift({

                        ...result,

                        previewUrl:
                            currentImagePreview,

                        timestamp:
                            Date.now()

                    });


                    Storage.set(

                        `history_${user.username}`,

                        history.slice(0, 100)

                    );
                }


                // Display results

                displayAnalysisResults(

                    resultsArea,

                    result

                );


            } catch (error) {

                console.error(
                    "Gemini Analysis Error:",
                    error
                );


                resultsArea.innerHTML = `

                    <div
                        class="result-card"
                        style="
                            border-left:
                            4px solid #e74c3c;
                        "
                    >

                        <h3>
                            <i
                                class="
                                fas
                                fa-exclamation-triangle
                                "
                            ></i>

                            Analysis Failed
                        </h3>


                        <p>

                            ${
                                escapeHtml(
                                    error.message
                                )
                            }

                        </p>


                        <p
                            style="
                                font-size: 0.85rem;
                                opacity: 0.8;
                            "
                        >

                            Check your Gemini API key,
                            internet connection,
                            and API quota.

                        </p>

                    </div>

                `;


            } finally {

                runBtn.disabled = false;

                runBtn.innerHTML = `
                    <i class="fas fa-brain"></i>
                    Run AI Analysis
                `;
            }

        });

    }

}


// ============================================================
// GEMINI ANALYSIS
// ============================================================

async function analyzeWithGemini(file) {

    // Convert image to Base64

    const base64Image =
        await fileToBase64(file);


    // Remove data:image/...;base64, prefix

    const base64Data =
        base64Image.split(",")[1];


    // --------------------------------------------------------
    // ANALYSIS PROMPT
    // --------------------------------------------------------

const prompt = `
You are the image classification component of CornVision AI.

Your task is to classify the uploaded corn seed/kernel image into
EXACTLY ONE of these three classes:

1. Waxy Corn
2. Sweet Corn
3. Hybrid Yellow Corn

IMPORTANT CLASSIFICATION RULES:

- You MUST select exactly one of the three classes.
- Never return Unknown.
- Never return "Cannot be identified".
- Do not invent another variety.
- Do not return multiple varieties.
- Base the classification only on visible characteristics of the uploaded image.

Analyze visible characteristics including:

- Kernel color
- Yellow or pale coloration
- Surface texture
- Kernel shape
- Roundness
- Size
- Wrinkling or smoothness
- Opacity or translucent appearance
- Uniformity
- Surface condition

The three possible classes are:

Waxy Corn:
- White, cream, pale, or light-colored.
- Often appears more rounded, plump, and smooth.
- Kernels may appear relatively opaque.
- Consider visible waxy or dense-looking characteristics.

Sweet Corn:
- May show more variation in shape.
- Mature or dried kernels may appear more wrinkled or shriveled.
- Consider sweetness-associated kernel appearance only from visible characteristics.

Hybrid Yellow Corn:
- Typically shows yellow-colored kernels.
- May appear firm, smooth, and relatively uniform.
- Consider strong yellow coloration and common hybrid grain appearance.

QUALITY ASSESSMENT:

Also evaluate the visible physical quality of the kernels.

Use exactly one of:

- High Quality
- Moderate Quality
- Low Quality

Consider:

- Surface damage
- Cracks
- Discoloration
- Wrinkling
- Shriveling
- Mold-like visible patterns
- Kernel uniformity
- Surface integrity

CONFIDENCE:

Return a confidence score from 0 to 100 representing confidence
ONLY in selecting among these three CornVision AI classes.

Even if multiple kernels are present, classify the overall visible
sample into the most likely one of the three classes.

Do not use randomness.
Do not fabricate laboratory measurements.
Do not claim genetic verification.
The result is an AI visual classification based on the image.

Return ONLY valid JSON.

Use exactly this structure:

{
  "variety": "Waxy Corn | Sweet Corn | Hybrid Yellow Corn",
  "quality": "High Quality | Moderate Quality | Low Quality",
  "confidence": 0,
  "general": "string",
  "visualIndicators": [
    "string",
    "string"
  ],
  "why": "string",
  "varietySpecific": "string",
  "recommendations": "string"
}
`;

    // --------------------------------------------------------
    // GEMINI API REQUEST
    // --------------------------------------------------------

const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

const response = await fetch(endpoint, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    })

        }

    );


    // --------------------------------------------------------
    // HANDLE API ERRORS
    // --------------------------------------------------------

    if (!response.ok) {

        const errorData =
            await response.json()
            .catch(() => null);


        console.error(
            "Gemini API Error:",
            errorData
        );


        throw new Error(

            errorData?.error?.message ||

            `Gemini API request failed
             with status ${response.status}`

        );

    }


    const data =
        await response.json();


    // --------------------------------------------------------
    // GET RESPONSE TEXT
    // --------------------------------------------------------

    const responseText =

        data?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text;


    if (!responseText) {

        console.error(
            "Unexpected Gemini response:",
            data
        );


        throw new Error(

            "Gemini returned no analysis result."

        );

    }


    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let result;


    try {

        result =
            JSON.parse(responseText);

    } catch (error) {

        console.error(
            "Invalid JSON:",
            responseText
        );


        throw new Error(

            "Gemini returned an invalid analysis format."

        );

    }


    // --------------------------------------------------------
    // VALIDATE AND NORMALIZE
    // --------------------------------------------------------

    return normalizeGeminiResult(result);

}


// ============================================================
// NORMALIZE GEMINI RESULT
// ============================================================

function normalizeGeminiResult(result) {

    const allowedVarieties = [
        "Waxy Corn",
        "Sweet Corn",
        "Hybrid Yellow Corn"
    ];

    const allowedQualities = [
        "High Quality",
        "Moderate Quality",
        "Low Quality"
    ];


    // Normalize variety

    let variety = String(
        result.variety || ""
    ).trim();


    // If Gemini returns an unexpected value,
    // attempt to match the expected classes.

    const varietyLower =
        variety.toLowerCase();


    if (
        varietyLower.includes("waxy")
    ) {

        variety = "Waxy Corn";

    } else if (
        varietyLower.includes("sweet")
    ) {

        variety = "Sweet Corn";

    } else if (
        varietyLower.includes("hybrid")
    ) {

        variety = "Hybrid Yellow Corn";

    } else if (
        varietyLower.includes("yellow")
    ) {

        variety = "Hybrid Yellow Corn";

    } else {

        // Closed classification system:
        // Gemini must return one of the three.

        variety = "Hybrid Yellow Corn";
    }


    // Normalize quality

    let quality =
        result.quality;


    if (
        !allowedQualities.includes(
            quality
        )
    ) {

        quality =
            "Moderate Quality";

    }


    // Normalize confidence

    let confidence =
        Number(
            result.confidence
        );


    if (
        Number.isNaN(
            confidence
        )
    ) {

        confidence = 50;

    }


    confidence = Math.max(
        0,
        Math.min(
            100,
            Math.round(
                confidence
            )
        )
    );


    // Normalize visual indicators

    let visualIndicators =
        Array.isArray(
            result.visualIndicators
        )

            ? result.visualIndicators
            : [];


    if (
        visualIndicators.length === 0
    ) {

        visualIndicators = [
            "Kernel color and surface appearance analyzed",
            "Kernel shape and visual uniformity evaluated"
        ];

    }


    return {

        variety:
            variety,

        quality:
            quality,

        confidence:
            confidence,

        general:

            result.general ||

            "The corn kernels were visually analyzed based on their color, shape, texture, and surface characteristics.",

        visualIndicators:
            visualIndicators,

        why:

            result.why ||

            "The quality grade was determined from the visible physical characteristics of the corn kernels.",

        varietySpecific:

            result.varietySpecific ||

            `The visible characteristics most closely match the ${variety} classification.`,

        recommendations:

            result.recommendations ||

            "Use a clear, well-lit image with the kernels clearly visible for the best classification."
    };

}


// ============================================================
// DISPLAY RESULTS
// ============================================================

function displayAnalysisResults(

    resultsArea,

    result

) {

    const qualityClass =

        result.quality
            .toLowerCase()
            .replace(/\s+/g, "-");


    const visualIndicatorsHtml =

        result.visualIndicators.length

            ? `

                <ul>

                    ${
                        result.visualIndicators
                            .map(

                                item => `

                                    <li>

                                        ${
                                            escapeHtml(
                                                item
                                            )
                                        }

                                    </li>

                                `

                            )
                            .join("")

                    }

                </ul>

            `

            : `

                <p>

                    No detailed visual indicators returned.

                </p>

            `;


    resultsArea.innerHTML = `

        <div class="result-card">


            <!-- VARIETY -->

            <div class="result-item-full">

                <div class="result-label">

                    Variety

                </div>


                <div class="result-value-large">

                    ${
                        escapeHtml(
                            result.variety
                        )
                    }

                </div>

            </div>


            <!-- QUALITY -->

            <div class="result-item-full">

                <div class="result-label">

                    Quality Grade

                </div>


                <div
                    class="
                        result-value-large
                        quality-${qualityClass}
                    "
                >

                    ${
                        escapeHtml(
                            result.quality
                        )
                    }


                    <div
                        style="
                            font-size:
                            1rem;

                            margin-top:
                            0.5rem;

                            opacity:
                            0.8;
                        "
                    >

                        Visual Confidence:

                        ${
                            result.confidence
                        }%

                    </div>

                </div>

            </div>


            <!-- QUALITY CRITERIA -->

            <div
                class="
                    quality-criteria
                    ${qualityClass}
                "
            >


                <h4>

                    <i
                        class="
                            fas
                            fa-clipboard-list
                        "
                    ></i>

                    AI Visual Assessment

                </h4>


                <!-- SUMMARY -->

                <div
                    class="
                        criteria-section
                    "
                >

                    <strong>

                        📊 Quality Summary:

                    </strong>


                    <p>

                        ${
                            escapeHtml(
                                result.general
                            )
                        }

                    </p>

                </div>


                <!-- VISUAL INDICATORS -->

                <div
                    class="
                        criteria-section
                    "
                >

                    <strong>

                        👁️ Visual Indicators Observed:

                    </strong>


                    ${visualIndicatorsHtml}

                </div>


                <!-- WHY -->

                <div
                    class="
                        why-explanation
                    "
                >

                    <strong>

                        <i
                            class="
                                fas
                                fa-question-circle
                            "
                        ></i>

                        Why ${
                            escapeHtml(
                                result.quality
                            )
                        }?

                    </strong>


                    <br>


                    ${
                        escapeHtml(
                            result.why
                        )
                    }

                </div>


                <!-- VARIETY NOTES -->

                ${
                    result.varietySpecific

                        ? `

                            <div
                                class="
                                    criteria-section
                                "
                            >

                                <strong>

                                    🌽 Variety Notes:

                                </strong>


                                <p>

                                    ${
                                        escapeHtml(
                                            result.varietySpecific
                                        )
                                    }

                                </p>

                            </div>

                        `

                        : ""

                }


                <!-- RECOMMENDATIONS -->

                <div
                    class="
                        recommendations-box
                        ${qualityClass}
                    "
                >

                    <strong>

                        <i
                            class="
                                fas
                                fa-lightbulb
                            "
                        ></i>

                        Recommendations:

                    </strong>


                    <br>


                    ${
                        escapeHtml(
                            result.recommendations
                        )
                    }

                </div>


                <!-- AI DISCLAIMER -->

                <div
                    style="
                        margin-top:
                        1rem;

                        font-size:
                        0.75rem;

                        opacity:
                        0.7;
                    "
                >

                    AI visual assessment only.
                    Results are based on visible image
                    characteristics and are not a laboratory
                    or certified seed-quality test.

                </div>

            </div>


            <!-- SAVE -->

            <div
                class="result-actions"
                style="
                    margin-top:
                    1.5rem;
                "
            >

                <button
                    class="
                        btn-outline
                        save-result
                    "
                >

                    <i
                        class="
                            fas
                            fa-save
                        "
                    ></i>

                    Save to Collection

                </button>

            </div>

        </div>

    `;


    // Save button

    const saveBtn =

        resultsArea.querySelector(
            ".save-result"
        );


    if (saveBtn) {

        saveBtn.addEventListener(
            "click",

            () => {

                if (
                    typeof showNotification ===
                    "function"
                ) {

                    showNotification(

                        "Analysis saved to collection!",

                        "success"

                    );

                }

            }

        );

    }

}


// ============================================================
// CONVERT FILE TO BASE64
// ============================================================

function fileToBase64(file) {

    return new Promise(

        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () =>

                resolve(
                    reader.result
                );


            reader.onerror = error =>

                reject(
                    error
                );


            reader.readAsDataURL(
                file
            );

        }

    );

}


// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// BATCH ANALYSIS
// ============================================================

function initBatchTab() {

    const batchZone =
        document.getElementById(
            "batchZone"
        );


    const batchInput =
        document.getElementById(
            "batchInput"
        );


    const batchSelectBtn =
        document.getElementById(
            "batchSelectBtn"
        );


    const batchQueueDiv =
        document.getElementById(
            "batchQueue"
        );


    const batchPreview =
        document.getElementById(
            "batchPreview"
        );


    const processBtn =
        document.getElementById(
            "processBatchBtn"
        );


    const exportBtn =
        document.getElementById(
            "exportBatchBtn"
        );


    if (
        !batchZone ||
        !batchInput
    ) return;


    function addToBatch(files) {

        Array.from(files).forEach(
            file => {

                if (
                    file.type.startsWith(
                        "image/"
                    )
                ) {

                    const reader =
                        new FileReader();


                    reader.onload =
                        e => {

                            batchQueue.push({

                                file:

                                    file,


                                preview:

                                    e.target.result,


                                name:

                                    file.name,


                                result:

                                    null

                            });


                            updateBatchPreview();

                        };


                    reader.readAsDataURL(
                        file
                    );

                }

            }

        );

    }


    function updateBatchPreview() {

        if (
            batchQueue.length > 0
        ) {

            batchQueueDiv.classList.remove(
                "hidden"
            );


            batchPreview.innerHTML =
                batchQueue.map(

                    (item, index) => `

                        <div
                            class="batch-item"
                        >

                            <img
                                src="${item.preview}"
                                alt="${escapeHtml(item.name)}"
                            >


                            <div
                                class="remove-btn"
                                data-index="${index}"
                            >

                                <i
                                    class="
                                        fas
                                        fa-times
                                    "
                                ></i>

                            </div>


                            ${
                                item.result

                                    ? `

                                        <div
                                            class="
                                                result-badge
                                            "
                                        >

                                            <i
                                                class="
                                                    fas
                                                    fa-check
                                                "
                                            ></i>

                                        </div>

                                    `

                                    : ""

                            }

                        </div>

                    `

                )

                .join("");


            const queueCount =
                document.getElementById(
                    "queueCount"
                );


            if (queueCount) {

                queueCount.textContent =
                    batchQueue.length;

            }


            if (processBtn) {

                processBtn.innerHTML = `

                    <i
                        class="
                            fas
                            fa-play
                        "
                    ></i>

                    Process All
                    (${batchQueue.length})

                `;

            }


            document
                .querySelectorAll(
                    ".remove-btn"
                )

                .forEach(

                    btn => {

                        btn.addEventListener(

                            "click",

                            () => {

                                const index =
                                    parseInt(

                                        btn.getAttribute(
                                            "data-index"
                                        )

                                    );


                                batchQueue.splice(
                                    index,
                                    1
                                );


                                updateBatchPreview();

                            }

                        );

                    }

                );


        } else {

            batchQueueDiv.classList.add(
                "hidden"
            );

        }

    }


    batchZone.addEventListener(
        "click",

        () => batchInput.click()
    );


    if (batchSelectBtn) {

        batchSelectBtn.addEventListener(

            "click",

            e => {

                e.stopPropagation();

                batchInput.click();

            }

        );

    }


    batchInput.addEventListener(
        "change",

        e => {

            if (
                e.target.files.length
            ) {

                addToBatch(
                    e.target.files
                );

            }

        }

    );


    // PROCESS BATCH

    if (processBtn) {

        processBtn.addEventListener(

            "click",

            async () => {

                const progressDiv =
                    document.getElementById(
                        "batchProgress"
                    );


                const progressFill =
                    progressDiv?.querySelector(
                        ".progress-fill"
                    );


                const progressText =
                    document.getElementById(
                        "progressText"
                    );


                if (progressDiv) {

                    progressDiv.classList.remove(
                        "hidden"
                    );

                }


                processBtn.disabled =
                    true;


                try {

                    for (

                        let i = 0;

                        i <
                        batchQueue.length;

                        i++

                    ) {

                        const item =
                            batchQueue[i];


                        const progress =

                            (
                                (i + 1) /
                                batchQueue.length
                            )

                            * 100;


                        if (progressFill) {

                            progressFill.style.width =
                                `${progress}%`;

                        }


                        if (progressText) {

                            progressText.textContent =
                                `${i + 1}/${batchQueue.length}`;

                        }


                        // REAL GEMINI ANALYSIS

                        item.result =
                            await analyzeWithGemini(
                                item.file
                            );


                        updateBatchPreview();

                    }


                    if (
                        typeof showNotification ===
                        "function"
                    ) {

                        showNotification(

                            `Batch processing complete! ${batchQueue.length} images analyzed.`,

                            "success"

                        );

                    }


                    if (exportBtn) {

                        exportBtn.disabled =
                            false;

                    }


                } catch (error) {

                    console.error(
                        error
                    );


                    alert(
                        "Batch analysis failed: " +
                        error.message
                    );


                } finally {

                    processBtn.disabled =
                        false;

                }

            }

        );

    }


    // EXPORT CSV

    if (exportBtn) {

        exportBtn.addEventListener(

            "click",

            () => {

                const results =
                    batchQueue

                        .map(
                            item =>
                                item.result
                        )

                        .filter(
                            result =>
                                result
                        );


                if (
                    typeof exportToCSV ===
                    "function"
                ) {

                    exportToCSV(

                        results,

                        `batch_analysis_${Date.now()}.csv`

                    );

                }

            }

        );

    }

}
