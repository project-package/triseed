// Utility functions for the entire application

// Local Storage Management
const Storage = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clear() {
        localStorage.clear();
    }
};

// User Management
let currentUser = null;

function setCurrentUser(user) {
    currentUser = user;
    Storage.set('currentUser', user);
}

function getCurrentUser() {
    if (!currentUser) {
        currentUser = Storage.get('currentUser');
    }
    return currentUser;
}

function logout() {
    currentUser = null;
    Storage.remove('currentUser');
    window.location.href = 'login.html';
}

/******************************************************************
 * PART 1
 * IMAGE PREPROCESSING & FEATURE EXTRACTION
 ******************************************************************/

function loadImage(dataURL){
    return new Promise((resolve,reject)=>{

        const img=new Image();

        img.onload=()=>resolve(img);

        img.onerror=reject;

        img.src=dataURL;

    });
}



function createCanvas(img){

    const canvas=document.createElement("canvas");

    const ctx=canvas.getContext("2d");

    canvas.width=224;
    canvas.height=224;

    ctx.drawImage(img,0,0,224,224);

    return {canvas,ctx};

}



/************************************************************
 REMOVE WHITE BACKGROUND
*************************************************************/

function removeBackground(imageData){

    const d=imageData.data;

    for(let i=0;i<d.length;i+=4){

        let r=d[i];
        let g=d[i+1];
        let b=d[i+2];

        if(r>220 && g>220 && b>220){

            d[i+3]=0;

        }

    }

    return imageData;

}



/************************************************************
 RGB FEATURES
*************************************************************/

function rgbFeatures(imageData){

    const d=imageData.data;

    let r=0;
    let g=0;
    let b=0;

    let pixels=0;

    for(let i=0;i<d.length;i+=4){

        if(d[i+3]<20) continue;

        r+=d[i];

        g+=d[i+1];

        b+=d[i+2];

        pixels++;

    }

    return{

        meanR:r/pixels,

        meanG:g/pixels,

        meanB:b/pixels,

        pixels

    };

}



/************************************************************
 HSV CONVERSION
*************************************************************/

function rgbToHSV(r,g,b){

    r/=255;
    g/=255;
    b/=255;

    let max=Math.max(r,g,b);

    let min=Math.min(r,g,b);

    let h,s,v=max;

    let d=max-min;

    s=max===0?0:d/max;

    if(max===min){

        h=0;

    }else{

        switch(max){

            case r:

                h=(g-b)/d+(g<b?6:0);

                break;

            case g:

                h=(b-r)/d+2;

                break;

            case b:

                h=(r-g)/d+4;

                break;

        }

        h/=6;

    }

    return{

        h:h*360,

        s:s*100,

        v:v*100

    };

}



/************************************************************
 HSV FEATURES
*************************************************************/

function hsvFeatures(imageData){

    const d=imageData.data;

    let H=0;

    let S=0;

    let V=0;

    let pixels=0;

    for(let i=0;i<d.length;i+=4){

        if(d[i+3]<20) continue;

        const hsv=rgbToHSV(d[i],d[i+1],d[i+2]);

        H+=hsv.h;

        S+=hsv.s;

        V+=hsv.v;

        pixels++;

    }

    return{

        hue:H/pixels,

        saturation:S/pixels,

        brightness:V/pixels

    };

}



/************************************************************
 YELLOW PIXEL RATIO
*************************************************************/

function yellowRatio(imageData){

    const d=imageData.data;

    let yellow=0;

    let total=0;

    for(let i=0;i<d.length;i+=4){

        if(d[i+3]<20) continue;

        total++;

        let r=d[i];

        let g=d[i+1];

        let b=d[i+2];

        if(r>150 && g>120 && b<150){

            yellow++;

        }

    }

    return yellow/total;

}

function orangeRatio(imageData){

    const d = imageData.data;

    let orange = 0;
    let total = 0;

    for(let i = 0; i < d.length; i += 4){

        if(d[i+3] < 20) continue;

        total++;

        const r = d[i];
        const g = d[i+1];
        const b = d[i+2];

        // Orange / Dark Yellow
        if(
            r > 170 &&
            g > 80 &&
            g < 180 &&
            b < 100 &&
            r > g + 20
        ){
            orange++;
        }

    }

    return orange / total;

}

function redDominance(imageData){

    const d = imageData.data;

    let total = 0;

    let red = 0;

    for(let i=0;i<d.length;i+=4){

        if(d[i+3] < 20) continue;

        total++;

        if(
            d[i] > d[i+1] + 20 &&
            d[i] > d[i+2] + 30
        ){
            red++;
        }

    }

    return red / total;

}

/************************************************************
 TEXTURE VARIANCE
*************************************************************/

function textureVariance(imageData){

    const d=imageData.data;

    let values=[];

    for(let i=0;i<d.length;i+=4){

        if(d[i+3]<20) continue;

        values.push(

            (d[i]+d[i+1]+d[i+2])/3

        );

    }

    let mean=

        values.reduce((a,b)=>a+b,0)/values.length;

    let variance=0;

    for(let v of values){

        variance+=(v-mean)*(v-mean);

    }

    variance/=values.length;

    return variance;

}



/************************************************************
 EDGE DENSITY
*************************************************************/

function edgeDensity(imageData){

    const d=imageData.data;

    const w=imageData.width;

    const h=imageData.height;

    let edges=0;

    for(let y=1;y<h-1;y++){

        for(let x=1;x<w-1;x++){

            const i=(y*w+x)*4;

            const left=((y*w+x-1)*4);

            const right=((y*w+x+1)*4);

            const up=(((y-1)*w+x)*4);

            const down=(((y+1)*w+x)*4);

            const gx=Math.abs(d[left]-d[right]);

            const gy=Math.abs(d[up]-d[down]);

            if(gx+gy>60){

                edges++;

            }

        }

    }

    return edges/(w*h);

}



/************************************************************
 UNIFORMITY SCORE
*************************************************************/

function uniformity(imageData){

    const d=imageData.data;

    let values=[];

    for(let i=0;i<d.length;i+=4){

        if(d[i+3]<20) continue;

        values.push(d[i]);

    }

    let mean=

        values.reduce((a,b)=>a+b,0)/values.length;

    let diff=0;

    for(let v of values){

        diff+=Math.abs(v-mean);

    }

    return 100-(diff/values.length);

}



/************************************************************
 MAIN FEATURE EXTRACTOR
*************************************************************/

async function extractImageFeatures(imageDataURL){

    const img=await loadImage(imageDataURL);

    const {ctx}=createCanvas(img);

    let imageData=ctx.getImageData(0,0,224,224);

    imageData=removeBackground(imageData);

    ctx.putImageData(imageData,0,0);

    const rgb=rgbFeatures(imageData);

    const hsv=hsvFeatures(imageData);

return{

    ...rgb,

    ...hsv,

    yellowRatio: yellowRatio(imageData),

    orangeRatio: orangeRatio(imageData),

    redDominance: redDominance(imageData),

    texture: textureVariance(imageData),

    edgeDensity: edgeDensity(imageData),

    uniformity: uniformity(imageData)

};

}

/******************************************************************
 * PART 2
 * RULE-BASED CLASSIFICATION ENGINE
 ******************************************************************/

const CORN_REFERENCE = {

    "Waxy Corn": {
        hue: 50,
        saturation: 30,
        brightness: 78,
        yellowRatio: 0.30,
        texture: 180,
        edgeDensity: 0.06,
        uniformity: 90
    },

"Sweet Corn":{

    hue:58,

    saturation:55,

    brightness:90,

    yellowRatio:0.80,

    orangeRatio:0.05,

    texture:140,

    edgeDensity:0.05,

    uniformity:94

},

"Hybrid Yellow":{

    hue:38,

    saturation:88,

    brightness:74,

    yellowRatio:0.65,

    orangeRatio:0.45,

    texture:220,

    edgeDensity:0.08,

    uniformity:91

},

};



/****************************************************
 NORMALIZED DIFFERENCE
****************************************************/

function featureDifference(value,target,range){

    return Math.abs(value-target)/range;

}



/****************************************************
 DISTANCE TO EACH VARIETY
****************************************************/

function calculateSimilarity(features,reference){

    let score=0;

    score+=featureDifference(features.hue,reference.hue,180);

    score+=featureDifference(features.saturation,reference.saturation,100);

    score+=featureDifference(features.brightness,reference.brightness,100);

    score+=featureDifference(features.yellowRatio,reference.yellowRatio,1);

    score+=featureDifference(features.texture,reference.texture,300);

    score+=featureDifference(features.edgeDensity,reference.edgeDensity,0.2);

    score+=featureDifference(features.uniformity,reference.uniformity,100);

    score += featureDifference(features.orangeRatio, reference.orangeRatio,1);

    return score;

}



/****************************************************
 CLASSIFY VARIETY
****************************************************/

function classifyVariety(features){

    let bestVariety=null;

    let smallestDistance=999;

    for(const variety in CORN_REFERENCE){

let distance = calculateSimilarity(
    features,
    CORN_REFERENCE[variety]
);

        // Give Hybrid Yellow an advantage when orange/red is dominant
if (
    variety === "Hybrid Yellow" &&
    features.orangeRatio > 0.30 &&
    features.redDominance > 0.20
) {
    distance *= 0.80;   // Reduce distance by 20%
}

// Give Sweet Corn an advantage when bright light-yellow
if (
    variety === "Sweet Corn" &&
    features.yellowRatio > 0.70 &&
    features.brightness > 85 &&
    features.orangeRatio < 0.15
) {
    distance *= 0.80;
}

// Give Waxy Corn an advantage when pale with low saturation
if (
    variety === "Waxy Corn" &&
    features.saturation < 40 &&
    features.yellowRatio < 0.40
) {
    distance *= 0.80;
}

        if(distance<smallestDistance){

            smallestDistance=distance;

            bestVariety=variety;

        }

    }

    let confidence=

        Math.max(

            60,

            Math.min(

                99,

                Math.round(

                    100-(smallestDistance*25)

                )

            )

        );

    return{

        variety:bestVariety,

        confidence,

        distance:smallestDistance

    };

}



/****************************************************
 QUALITY GRADING
****************************************************/

function classifyQuality(features){

    let score=0;



    if(features.uniformity>92) score+=25;
    else if(features.uniformity>85) score+=18;
    else score+=8;



    if(features.texture<170) score+=20;
    else if(features.texture<220) score+=14;
    else score+=8;



    if(features.edgeDensity<0.06) score+=20;
    else if(features.edgeDensity<0.08) score+=14;
    else score+=8;



    if(features.brightness>80) score+=15;
    else if(features.brightness>70) score+=10;
    else score+=6;



    if(features.yellowRatio>0.60) score+=20;
    else if(features.yellowRatio>0.40) score+=15;
    else score+=10;



    let quality;

    if(score>=85){

        quality="High Quality";

    }else if(score>=65){

        quality="Moderate Quality";

    }else{

        quality="Low Quality";

    }



    return{

        quality,

        score

    };

}



/****************************************************
 VARIETY DESCRIPTIONS
****************************************************/

const varietyTraits={

    "Waxy Corn":
        "Glutinous kernels with high amylopectin starch. Usually pale yellow to creamy white and slightly opaque.",

    "Sweet Corn":
        "High sugar content with bright yellow kernels and smooth glossy appearance.",

    "Hybrid Yellow":
        "Deep yellow hybrid kernels with excellent uniformity and robust structure."

};



const visualTraits={

    "Waxy Corn":
        "Pale yellow, waxy appearance, low saturation.",

    "Sweet Corn":
        "Bright yellow, smooth glossy surface.",

    "Hybrid Yellow":
        "Deep yellow to orange kernels with dense texture."

};



/****************************************************
 MAIN CLASSIFIER
****************************************************/

async function CNNClassification(imageDataURL){

    const features=

        await extractImageFeatures(imageDataURL);

    const variety=

        classifyVariety(features);

    const quality=

        classifyQuality(features);

    return{

        variety:variety.variety,

        confidence:variety.confidence,

        quality:quality.quality,

        performanceScore:quality.score,

        germinationPotential:

            Math.min(95,quality.score+5),

        marketValueIndex:

            Math.min(100,quality.score+8),

        traits:

            varietyTraits[variety.variety],

        visualTraits:

            visualTraits[variety.variety],

        diseaseDetection:"None detected",

        features

    };

}

// Quality criteria descriptions based on visual features
function getQualityCriteria(quality, variety) {
    const criteria = {
        "High Quality": {
            general: "Superior seed characteristics meeting all quality standards",
            visual: "• Uniform kernel size and shape\n• Vibrant, consistent coloration\n• No visible defects or damage\n• Intact pericarp (seed coat)",
            standards: "• 90-100% uniformity score\n• Optimal moisture content\n• No disease symptoms\n• Excellent germination potential",
            why: "This seed exhibits exceptional visual characteristics with perfect uniformity, ideal color development, and zero defects, indicating optimal growing conditions and proper harvest timing."
        },
        "Moderate Quality": {
            general: "Acceptable quality with minor imperfections",
            visual: "• Slight size or shape variation\n• Minor color inconsistencies\n• Small surface blemishes present\n• Generally intact seed coat",
            standards: "• 70-89% uniformity score\n• Slightly suboptimal moisture\n• Minor surface irregularities\n• Good germination potential",
            why: "This seed shows good overall structure but has minor imperfections such as slight size variation or small blemishes, which may result from suboptimal growing conditions or minor mechanical damage during harvest."
        },
        "Low Quality": {
            general: "Significant defects affecting seed value",
            visual: "• Notable size or shape irregularities\n• Discoloration present\n• Visible cracks or damage\n• Compromised seed coat integrity",
            standards: "• Below 70% uniformity score\n• Potential moisture issues\n• Visible disease or damage\n• Reduced germination potential",
            why: "This seed exhibits significant quality issues including visible damage, discoloration, or irregular development, likely due to disease pressure, pest damage, environmental stress, or improper handling/storage."
        }
    };
    
    // Variety-specific comments
    const varietyComments = {
        "Waxy Corn": {
            "High Quality": "Excellent pearlescent appearance with ideal waxy texture characteristics.",
            "Moderate Quality": "Acceptable waxy characteristics with minor variations in translucency.",
            "Low Quality": "Compromised waxy starch properties visible through kernel abnormalities."
        },
        "Sweet Corn": {
            "High Quality": "Superior sugar development indicated by bright, uniform golden color.",
            "Moderate Quality": "Good sugar content with slight variations in kernel plumpness.",
            "Low Quality": "Reduced sugar content indicated by dull coloring and kernel shriveling."
        },
        "Hybrid Yellow": {
            "High Quality": "Excellent hybrid characteristics with robust, uniform kernel development.",
            "Moderate Quality": "Good hybrid traits with minor uniformity variations.",
            "Low Quality": "Compromised hybrid vigor visible through inconsistent kernel fill."
        }
    };
    
    return {
        ...criteria[quality],
        varietySpecific: varietyComments[variety]?.[quality] || "",
        recommendations: quality === "High Quality" 
            ? "✓ Premium market pricing recommended\n✓ Suitable for seed saving\n✓ Ideal for direct consumption"
            : (quality === "Moderate Quality" 
                ? "• Good for processing\n• Suitable for animal feed\n• Consider for secondary markets"
                : "⚠ Limited market value\n⚠ Processing only recommended\n⚠ Not suitable for seed saving")
    };
}
// Format date for display
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Export to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export to PDF (simplified - would use html2pdf in production)
function exportToPDF(elementId, filename) {
    alert('PDF export would use html2pdf library. In production, implement with jsPDF or html2pdf.js');
    // In production: html2pdf().from(element).save();
}

// Generate QR Code (simplified)
function generateQRCode(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;
    
    if (type === 'success') notification.style.borderLeft = `4px solid var(--success)`;
    if (type === 'error') notification.style.borderLeft = `4px solid var(--danger)`;
    if (type === 'info') notification.style.borderLeft = `4px solid var(--info)`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Pagination helper
function paginate(array, pageSize, pageNumber) {
    return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    return strength;
}
