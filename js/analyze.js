
// ============================================================
// CornVision AI - Gemini Vision Analysis
// ============================================================

// IMPORTANT:
// For testing only, paste your Gemini API key below.
// Do NOT expose this key in a public production website.
const GEMINI_API_KEY = "AQ.Ab8RN6JHAYPmtx4EztEIF9PD3sKkl_o75spvevwWHdVvol6r4w";

// You can change this model if needed.
const GEMINI_MODEL = "gemini-2.5-flash";

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

You are an AI assistant helping analyze an uploaded image
of a corn seed/kernel for an agricultural project called
CornVision AI.

Analyze ONLY visible characteristics in the image.

Do NOT claim laboratory accuracy.
Do NOT invent facts that cannot be visually determined.

Evaluate visible characteristics such as:

- Kernel shape
- Kernel size consistency
- Color consistency
- Surface damage
- Cracks
- Discoloration
- Mold-like visible patterns
- Shriveling
- Surface integrity
- Visual uniformity

For variety identification:

Only identify a variety if visible characteristics provide
reasonable evidence.

If the exact corn variety cannot be determined from the image,
return:

"Unknown / Cannot be reliably identified visually"

For quality:

Use one of these values ONLY:

- High Quality
- Moderate Quality
- Low Quality

The confidence value must represent confidence in the VISUAL
assessment only.

Do not present the result as laboratory-tested,
scientifically verified, or guaranteed accurate.

Return ONLY valid JSON.

Use exactly this structure:

{
  "variety": "string",
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

Rules:

- confidence must be an integer from 0 to 100
- visualIndicators must contain 2 to 6 observations
- If the image does not clearly show a corn seed,
  mention this in general and reduce confidence
- Do not guess an exact variety without strong visual evidence
- Base all observations on what is actually visible

`;


    // --------------------------------------------------------
    // GEMINI API REQUEST
    // --------------------------------------------------------

    const endpoint =

        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


    const response = await fetch(

        endpoint,

        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "x-goog-api-key":
                    GEMINI_API_KEY

            },


            body:

                JSON.stringify({

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {

                                    text:
                                        prompt

                                },

                                {

                                    inlineData: {

                                        mimeType:
                                            file.type,

                                        data:
                                            base64Data

                                    }

                                }

                            ]

                        }

                    ],


                    generationConfig: {

                        temperature:
                            0.2,

                        responseMimeType:
                            "application/json"

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

    const allowedQualities = [

        "High Quality",

        "Moderate Quality",

        "Low Quality"

    ];


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


    let confidence =
        Number(result.confidence);


    if (
        Number.isNaN(
            confidence
        )
    ) {

        confidence =
            0;

    }


    confidence =
        Math.max(

            0,

            Math.min(

                100,

                Math.round(
                    confidence
                )

            )

        );


    return {

        variety:

            result.variety ||

            "Unknown / Cannot be reliably identified visually",


        quality:


            quality,


        confidence:


            confidence,


        general:


            result.general ||

            "No detailed visual assessment was returned.",


        visualIndicators:

            Array.isArray(
                result.visualIndicators
            )

                ? result.visualIndicators

                : [],


        why:

            result.why ||

            "The quality grade is based only on visible characteristics.",


        varietySpecific:

            result.varietySpecific ||

            "",


        recommendations:

            result.recommendations ||

            "Use a clear, well-lit image for a better visual assessment."

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
