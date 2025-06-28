// Import Firebase modules (using full CDN URLs)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// FIX: Ensure query and where are imported
import { getFirestore, doc, setDoc, addDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =====================================================================
// Please paste your Firebase project configuration here!
// You can find this configuration object in your Firebase Console (console.firebase.google.com)
// Select your project -> Project settings -> General -> Your apps.
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCZSC4KP9r9Ia74gjhVM4hkhkCiXU6ltR4", // <--- 請替換為您的 API Key
  authDomain: "avny-ccbe9.firebaseapp.com", // <--- 請替換為您的專案 ID (通常與 projectId 相關)
  projectId: "avny-ccbe9", // <--- 請替換為您的專案 ID
  storageBucket: "avny-ccbe9.firebasestorage.app", // <--- 請替換為您的專案 ID
  messagingSenderId: "686829295344", // <--- 請替換為您的發送者 ID
  appId: "1:686829295344:web:aa65fcfc89f15660701435" // <--- 請替換為您的應用程式 ID
};
// =====================================================================


// Firebase service instances will be stored in these module-scoped variables
let firestoreDb = null;
let firebaseAuth = null;
let firebaseAppInstance = null; // Stores the Firebase app instance
let currentAppId = null; // Derived from firebaseConfig.projectId

// Application state variables (module-scoped)
let userId = 'anonymous'; // Current user ID
let authReady = false; // Flag indicating if Firebase authentication is ready
let currentFormulaIntroCategoryFilter = '全部'; // Current filter category for formula introduction section

// --- DOM element retrieval ---
const userInfoElem = document.getElementById('user-info');
const showQuizBtn = document.getElementById('show-quiz-btn');
const showCategoryChallengeBtn = document.getElementById('show-category-challenge-btn');
const showFormulaIntroBtn = document.getElementById('show-formula-intro-btn');
const showMistakesBtn = document.getElementById('show-mistakes-btn');
const showManageBtn = document.getElementById('show-manage-btn');
const loadingSpinner = document.getElementById('loading-spinner');

// Quiz Section elements (Ingredient Composition Challenge)
const quizSection = document.getElementById('quiz-section');
const formulaNameElem = document.getElementById('formula-name');
const formulaHintElem = document.getElementById('formula-hint');
const userAnswerInput = document.getElementById('user-answer');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const showCorrectAnswerBtn = document.getElementById('show-correct-answer-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const feedbackMessageElem = document.getElementById('feedback-message');
const autocompleteResults = document.getElementById('autocomplete-results');
const noFormulasMessage = document.getElementById('no-formulas-message');

// Category Challenge Section elements (Formula Classification Challenge)
const categoryChallengeSection = document.getElementById('category-challenge-section');
const categoryFormulaNameElem = document.getElementById('category-formula-name');
const categoryChallengeHintElem = document.getElementById('category-challenge-hint');
const userCategoryAnswerInput = document.getElementById('user-category-answer');
const submitCategoryAnswerBtn = document.getElementById('submit-category-answer-btn');
const showCorrectCategoryAnswerBtn = document.getElementById('show-correct-category-answer-btn');
const nextCategoryQuestionBtn = document.getElementById('next-category-question-btn');
const categoryFeedbackMessageElem = document.getElementById('category-feedback-message');
const categoryAutocompleteResults = document.getElementById('category-autocomplete-results');
const noCategoryFormulasMessage = document.getElementById('no-category-formulas-message');

// Formula Introduction Section elements
const formulaIntroSection = document.getElementById('formula-intro-section');
const categoryFilterContainer = document.getElementById('category-filter-container');
const introSearchInput = document.getElementById('intro-search-input');
const formulaIntroductionsList = document.getElementById('formula-introductions-list');
const noIntroductionsMessage = document.getElementById('no-introductions-message');


// Mistakes Section elements
const mistakesSection = document.getElementById('mistakes-section');
const mistakesListElem = document.getElementById('mistakes-list');
const clearMistakesBtn = document.getElementById('clear-mistakes-btn');
const noMistakesMessageElem = document.getElementById('no-mistakes-message');

// Manage Section elements
const manageSection = document.getElementById('manage-section');
const formulaSearchInput = document.getElementById('formula-search-input');
const addFormulaBtn = document.getElementById('add-formula-btn');
const formulaListElem = document.getElementById('formula-list');
const noManagedFormulasMessage = document.getElementById('no-managed-formulas-message');

const categorySearchInput = document.getElementById('category-search-input');
const addCategoryChallengeBtn = document.getElementById('add-category-challenge-btn');
const categoryChallengeListElem = document.getElementById('category-challenge-list');
const noManagedCategoryChallengesMessage = document.getElementById('no-managed-category-challenges-message');

const managedIntroSearchInput = document.getElementById('managed-intro-search-input');
const addManagedFormulaIntroBtn = document.getElementById('add-managed-formula-intro-btn');
const managedFormulaIntroductionsList = document.getElementById('managed-formula-introductions-list');
const noManagedIntroductionsMessage = document.getElementById('no-managed-introductions-message');


// Formula Modal elements (Ingredient Composition Question Modal)
const formulaModal = document.getElementById('formula-modal');
const formulaModalTitle = document.getElementById('formula-modal-title');
const formulaForm = document.getElementById('formula-form');
const formulaNameInput = document.getElementById('formula-name-input');
const formulaIngredientsInput = document.getElementById('formula-ingredients-input');
const formulaHintInput = document.getElementById('formula-hint-input');
const cancelFormulaBtn = document.getElementById('cancel-formula-btn');

// Category Modal elements (Classification Question Modal)
const categoryModal = document.getElementById('category-modal');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryForm = document.getElementById('category-form');
const categoryFormulaNameInput = document.getElementById('category-formula-name-input');
const categoryAnswerInput = document.getElementById('category-answer-input');
const categoryHintInput = document.getElementById('category-hint-input');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');

// Formula Intro Modal elements (Introduction Card Modal - for Add/Edit)
const formulaIntroModal = document.getElementById('formula-intro-modal');
const formulaIntroModalTitle = document.getElementById('formula-intro-modal-title');
const formulaIntroForm = document.getElementById('formula-intro-form');
const introFormulaNameInput = document.getElementById('intro-formula-name-input');
const introCategoryInput = document.getElementById('intro-category-input');
const introCategoryAutocompleteResults = document.getElementById('intro-category-autocomplete-results');
const introIngredientsInput = document.getElementById('intro-ingredients-input');
const introIndicationsInput = document.getElementById('intro-indications-input');
const introEffectsInput = document.getElementById('intro-effects-input');
const cancelIntroBtn = document.getElementById('cancel-intro-btn');


// Custom Message Box elements
const customMessageBox = document.getElementById('custom-message-box');
const messageBoxTitle = document.getElementById('message-box-title');
const messageBoxContent = document.getElementById('message-box-content');
const messageBoxCloseBtn = document.getElementById('message-box-close-btn');
const messageBoxCancelBtn = document.getElementById('message-box-cancel-btn');

// --- Application State Data (module-scoped) ---
let currentFormula = null; // Current formula object for ingredient composition challenge
let currentCategoryChallenge = null; // Current formula object for classification challenge

let mistakeRecords = []; // Stores consolidated mistake records

let formulas = []; // Stores formula list for ingredient composition challenge
let categoryChallenges = []; // Stores formula list for classification challenge
let formulaIntroductions = []; // Stores formula introduction data

let allIngredients = []; // Stores all ingredient names for autocomplete in ingredient challenge
let allCategories = []; // Stores all category names for autocomplete and filtering in all category-related sections


// --- Firebase Initialization ---
async function initializeFirebase() {
    // Check if Firebase configuration is complete
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase configuration is missing or incomplete. Please update firebaseConfig in script.js.");
        await showCustomMessageBox("錯誤", "Firebase 配置不完整。請編輯 script.js 檔案並填入您的 Firebase 專案資訊。詳情請查看瀏覽器控制台。");
        hideLoadingSpinner();
        // Fallback to local storage if Firebase config is missing
        firestoreDb = null;
        firebaseAuth = null;
        firebaseAppInstance = null;
        userId = crypto.randomUUID(); // Generate a local user ID
        userInfoElem.textContent = `匿名使用者 ID: ${userId} (無 Firebase 連線)`;
        showManageBtn.classList.add('hidden'); // Cannot manage questions without Firebase
        authReady = true;
        // Load local data immediately if Firebase is not configured
        formulas = JSON.parse(localStorage.getItem('localFormulas') || '[]');
        categoryChallenges = JSON.parse(localStorage.getItem('localCategoryChallenges') || '[]');
        formulaIntroductions = JSON.parse(localStorage.getItem('localFormulaIntroductions') || '[]');
        loadMistakeRecordsLocal();
        initializeAllCategories();
        initializeAllIngredients();
        // Do NOT call displayQuestion() here. It will be called when the user clicks the challenge button.
        renderFormulaCategoriesFilter(); // Render category filter buttons
        renderFormulaIntroductions(); // Render introduction cards
        return;
    }

    try {
        firebaseAppInstance = initializeApp(firebaseConfig); // Assign Firebase app instance to module-level variable
        firebaseAuth = getAuth(firebaseAppInstance); // Use module-level variable
        firestoreDb = getFirestore(firebaseAppInstance); // Use module-level variable
        currentAppId = firebaseConfig.projectId; // Store project ID in module scope

        // Listen for authentication state changes
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                userId = user.uid;
                userInfoElem.textContent = `使用者 ID: ${userId}`;
                showManageBtn.classList.remove('hidden'); // Show manage button after login
                authReady = true;
                console.log(`Firebase 認證成功。使用者 ID: ${userId}`);
                // Start Firestore listeners once authentication is ready
                listenToFormulas();
                listenToCategoryChallenges();
                listenToFormulaIntroductions();
                listenToMistakeRecords();
            } else {
                // If no user logged in, try anonymous login
                try {
                    await signInAnonymously(firebaseAuth); // GitHub Pages defaults to anonymous login
                    userId = firebaseAuth.currentUser?.uid || crypto.randomUUID(); // Fallback in case uid is null
                    userInfoElem.textContent = `使用者 ID: ${userId} (匿名)`;
                    showManageBtn.classList.remove('hidden'); // Show manage button for anonymous users too
                    authReady = true;
                    console.log(`Firebase 匿名認證成功。使用者 ID: ${userId}`);
                    listenToFormulas();
                    listenToCategoryChallenges();
                    listenToFormulaIntroductions();
                    listenToMistakeRecords();
                } catch (error) {
                    console.error("Firebase authentication failed:", error);
                    userId = crypto.randomUUID(); // Fallback to a random ID if auth fails
                    userInfoElem.textContent = `匿名使用者 ID: ${userId} (登入失敗)`;
                    showManageBtn.classList.add('hidden'); // Hide manage button if login fails
                    authReady = true; // Mark as ready even if failed, to let app proceed
                    // If auth fails, still try to load questions (might have no permissions)
                    listenToFormulas();
                    listenToCategoryChallenges();
                    listenToFormulaIntroductions();
                    await showCustomMessageBox("認證失敗", "無法登入 Firebase，部分功能可能受限。");
                }
            }
            hideLoadingSpinner();
            // Do NOT call displayQuestion() here. It will be called when the user clicks the challenge button.
        });
    } catch (error) {
        // Catch initialization errors
        console.error("Firebase App 初始化失敗:", error);
        await showCustomMessageBox("初始化錯誤", `Firebase App 初始化失敗：${error.message || error}。請檢查您的 Firebase 配置是否正確。詳情請查看瀏覽器控制台。`);
        hideLoadingSpinner();
        // Fallback to local storage if Firebase initialization fails
        firestoreDb = null;
        firebaseAuth = null;
        firebaseAppInstance = null;
        userId = crypto.randomUUID();
        userInfoElem.textContent = `匿名使用者 ID: ${userId} (無 Firebase 連線)`;
        showManageBtn.classList.add('hidden');
        authReady = true;
        // Load local data immediately if Firebase initialization fails
        formulas = JSON.parse(localStorage.getItem('localFormulas') || '[]');
        categoryChallenges = JSON.parse(localStorage.getItem('localCategoryChallenges') || '[]');
        formulaIntroductions = JSON.parse(localStorage.getItem('localFormulaIntroductions') || '[]');
        loadMistakeRecordsLocal();
        initializeAllCategories();
        initializeAllIngredients();
        // Do NOT call displayQuestion() here. It will be called when the user clicks the challenge button.
        renderFormulaCategoriesFilter();
        renderFormulaIntroductions();
    }
}

// --- Firestore Data Listeners ---
function listenToFormulas() {
    if (!firestoreDb || !authReady) {
        console.warn("Firestore not ready for formulas listener. Data will not be loaded from cloud.");
        if (formulas.length === 0) {
            noFormulasMessage.classList.remove('hidden');
        }
        return;
    }
    console.log(`嘗試監聽藥材組成題目 (formulas) 路徑: artifacts/${currentAppId}/public/data/formulas`);
    const formulasColRef = collection(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`);
    onSnapshot(formulasColRef, (snapshot) => {
        formulas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Formulas loaded from Firestore:", formulas);
        initializeAllIngredients(); // Update autocomplete list
        initializeAllCategories(); // Because categories might come from ingredient formulas too
        // IMPORTANT: Removed direct displayQuestion() call here.
        // Question display is now triggered by explicit button clicks (showQuizBtn).
        renderManagedFormulas(formulaSearchInput.value); // Re-render management list (with search filter)
    }, (error) => {
        console.error("Error listening to formulas:", error);
        if (error.code === 'permission-denied') {
            showCustomMessageBox("錯誤", "載入藥材組成題目失敗：權限不足。請檢查您的 Firestore 安全規則，確保允許讀取公共題目。");
        } else {
            showCustomMessageBox("錯誤", "無法載入藥材組成題目，請檢查網路連線。");
        }
        if (formulas.length === 0) {
             noFormulasMessage.classList.remove('hidden');
        }
    });
}

function listenToCategoryChallenges() {
    if (!firestoreDb || !authReady) {
        console.warn("Firestore not ready for category challenges listener. Data will not be loaded from cloud.");
        if (categoryChallenges.length === 0) {
            noCategoryFormulasMessage.classList.remove('hidden');
        }
        return;
    }
    console.log(`嘗試監聽藥劑分類題目 (formula_categories) 路徑: artifacts/${currentAppId}/public/data/formula_categories`);
    const categoryColRef = collection(firestoreDb, `artifacts/${currentAppId}/public/data/formula_categories`);
    onSnapshot(categoryColRef, (snapshot) => {
        categoryChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Category Challenges loaded from Firestore:", categoryChallenges);
        initializeAllCategories(); // Update autocomplete list (now includes categories from all sources)
        renderFormulaCategoriesFilter(); // Render category filter buttons
        // IMPORTANT: Removed direct displayCategoryQuestion() call here.
        // Question display is now triggered by explicit button clicks (showCategoryChallengeBtn).
        renderManagedCategories(categorySearchInput.value); // Re-render category management list (with search filter)
    }, (error) => {
        console.error("Error listening to category challenges:", error);
        if (error.code === 'permission-denied') {
            showCustomMessageBox("錯誤", "載入藥劑分類題目失敗：權限不足。請檢查您的 Firestore 安全規則。");
        } else {
            showCustomMessageBox("錯誤", "無法載入藥劑分類題目，請檢查網路連線。");
        }
        if (categoryChallenges.length === 0) {
            noCategoryFormulasMessage.classList.remove('hidden');
        }
    });
}

function listenToFormulaIntroductions() {
    if (!firestoreDb || !authReady) {
        console.warn("Firestore not ready for formula introductions listener. Data will not be loaded from cloud.");
        if (formulaIntroductions.length === 0) {
            noIntroductionsMessage.classList.remove('hidden');
        }
        return;
    }
    console.log(`嘗試監聽方劑介紹 (formula_introductions) 路徑: artifacts/${currentAppId}/public/data/formula_introductions`);
    const introColRef = collection(firestoreDb, `artifacts/${currentAppId}/public/data/formula_introductions`);
    onSnapshot(introColRef, (snapshot) => {
        formulaIntroductions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Formula Introductions loaded from Firestore:", formulaIntroductions);
        initializeAllCategories(); // Update all category lists, as introduction cards also have categories
        renderFormulaCategoriesFilter(); // Re-render category filter buttons
        renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // Re-render introduction cards (with filter and search)
        renderManagedFormulaIntroductions(managedIntroSearchInput.value); // Re-render introduction cards in management section
    }, (error) => {
        console.error("Error listening to formula introductions:", error);
        if (error.code === 'permission-denied') {
            showCustomMessageBox("錯誤", "載入方劑介紹失敗：權限不足。請檢查您的 Firestore 安全規則。");
        } else {
            showCustomMessageBox("錯誤", "無法載入方劑介紹，請檢查網路連線。");
        }
        if (formulaIntroductions.length === 0) {
            noIntroductionsMessage.classList.remove('hidden');
        }
    });
}

function listenToMistakeRecords() {
    if (!firestoreDb || !authReady || userId === 'anonymous') {
        console.warn("Firestore or user not ready, cannot listen to mistake records. Falling back to LocalStorage.");
        loadMistakeRecordsLocal(); // Fallback to localStorage
        return;
    }
    // Print the specific Firestore path being listened to
    console.log(`嘗試監聽錯題記錄 (mistakeRecords) 路徑: artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
    const mistakeRecordsColRef = collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
    onSnapshot(mistakeRecordsColRef, (snapshot) => {
        // Map documents to mistakeRecords, ensuring 'count' field exists
        mistakeRecords = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                count: data.count || 1 // Default count to 1 if not defined (for older records)
            };
        });
        console.log("Mistake records loaded from Firestore:", mistakeRecords);
        if (mistakesSection.classList.contains('hidden')) {
            // If not on the mistake records page, no need to re-render
        } else {
            renderMistakes(); // Re-render mistake records list
        }
    }, (error) => {
        console.error("Error listening to mistake records:", error);
        // If it's a permission issue, show specific error code
        if (error.code === 'permission-denied') {
            showCustomMessageBox("錯誤", "載入錯題記錄失敗：權限不足。請檢查您的 Firestore 安全規則，確保允許讀寫您的私人錯題記錄。");
        } else {
            showCustomMessageBox("錯誤", "無法載入錯題記錄，請檢查網路連線。");
        }
    });
}


// --- Helper Functions: Show/Hide Sections ---
function showSection(sectionToShow) {
    quizSection.classList.add('hidden');
    categoryChallengeSection.classList.add('hidden');
    formulaIntroSection.classList.add('hidden');
    mistakesSection.classList.add('hidden');
    manageSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
    quizSection.classList.add('hidden');
    categoryChallengeSection.classList.add('hidden');
    formulaIntroSection.classList.add('hidden');
    mistakesSection.classList.add('hidden');
    manageSection.classList.add('hidden');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}

// --- Helper Functions: Custom Message Box ---
/**
 * Displays a custom message box.
 * @param {string} title - The title of the message box.
 * @param {string} message - The content of the message box.
 * @param {boolean} showCancelBtn - Whether to show the cancel button (for confirmation dialogs).
 * @returns {Promise<boolean>} Resolves to true if the user clicks confirm, false if they click cancel.
 */
function showCustomMessageBox(title, message, showCancelBtn = false) {
    return new Promise(resolve => {
        messageBoxTitle.textContent = title;
        messageBoxContent.textContent = message;
        customMessageBox.classList.remove('hidden');

        if (showCancelBtn) {
            messageBoxCancelBtn.classList.remove('hidden');
        } else {
            messageBoxCancelBtn.classList.add('hidden');
        }

        // Clear previous event listeners to prevent multiple triggers
        const confirmListener = () => {
            customMessageBox.classList.add('hidden');
            messageBoxCloseBtn.removeEventListener('click', confirmListener);
            messageBoxCancelBtn.removeEventListener('click', cancelListener);
            resolve(true);
        };

        const cancelListener = () => {
            customMessageBox.classList.add('hidden');
            messageBoxCloseBtn.removeEventListener('click', confirmListener);
            messageBoxCancelBtn.removeEventListener('click', cancelListener);
            resolve(false);
        };

        messageBoxCloseBtn.addEventListener('click', confirmListener);
        messageBoxCancelBtn.addEventListener('click', cancelListener);
    });
}


// --- Helper Functions: Data Processing ---
/**
 * Loads mistake records from localStorage (as a fallback when Firestore is not enabled).
 */
function loadMistakeRecordsLocal() {
    try {
        const records = localStorage.getItem('mistakeRecords');
        mistakeRecords = records ? JSON.parse(records) : [];
        // Ensure count is initialized for older records
        mistakeRecords = mistakeRecords.map(record => ({ ...record, count: record.count || 1 }));
    } catch (e) {
        console.error("Failed to load mistake records from localStorage:", e);
        mistakeRecords = [];
    }
}

/**
 * Saves mistake records to localStorage (as a fallback when Firestore is not enabled).
 */
function saveMistakeRecordsLocal() {
    try {
        localStorage.setItem('mistakeRecords', JSON.stringify(mistakeRecords));
    } catch (e) {
        console.error("Failed to save mistake records to localStorage:", e);
        showCustomMessageBox("錯誤", "無法儲存錯題記錄，請檢查瀏覽器儲存設定。");
    }
}

/**
 * Normalizes ingredient names for comparison.
 * Removes whitespace, converts to lowercase, and handles common synonyms/abbreviations.
 * @param {string} ingredient - The ingredient name.
 * @returns {string} The normalized ingredient name.
 */
function normalizeIngredient(ingredient) {
    return ingredient.trim().toLowerCase()
        .replace(/炙?甘草/g, '炙甘草') // Unify Zhigancao and Gancao
        .replace(/乾?地黃/g, '乾地黃') // Unify Gandihuang and Dihuang (assuming it refers to Shudihuang here)
        .replace(/熟地/g, '熟地黃') // Unify Shudi and Shudihuang
        .replace(/人蔘/g, '人參'); // Unify Renshen and Renshen
    // Add more synonym handling as needed
}

/**
 * Normalizes category names for comparison.
 * Removes whitespace and converts to lowercase.
 * @param {string} category - The category name.
 * @returns {string} The normalized category name.
 */
function normalizeCategory(category) {
    return category.trim().toLowerCase();
}

/**
 * Parses user input for ingredient lists.
 * @param {string} input - The user's input string.
 * @returns {string[]} An array of normalized ingredient names.
 */
function parseUserAnswer(input) {
    return input.split(/[,，\s\n]+/) // Split by comma, full-width comma, space, or newline
                .filter(item => item.trim() !== '') // Remove empty strings
                .map(normalizeIngredient); // Normalize each ingredient name
}

/**
 * Initializes all ingredient names for autocomplete (Ingredient Composition Challenge).
 */
function initializeAllIngredients() {
    const uniqueIngredients = new Set();
    formulas.forEach(formula => {
        if (formula.ingredients && Array.isArray(formula.ingredients)) {
            formula.ingredients.forEach(ing => {
                uniqueIngredients.add(ing); // Use original name for autocomplete display
            });
        }
    });
    allIngredients = Array.from(uniqueIngredients).sort();
}

/**
 * Initializes all category names for autocomplete (from all sources of categories).
 */
function initializeAllCategories() {
    const uniqueCategories = new Set();
    categoryChallenges.forEach(challenge => {
        if (challenge.category) {
            uniqueCategories.add(challenge.category);
        }
    });
    formulaIntroductions.forEach(intro => { // Get categories from formula introductions
        if (intro.category) {
            uniqueCategories.add(intro.category);
        }
    });
    allCategories = Array.from(uniqueCategories).sort();
}


// --- Core Question Selection Logic (Optimized) ---

/**
 * Selects a question based on a weighted random mechanism.
 * Questions answered incorrectly frequently have a higher chance of being selected.
 * Questions that have appeared many times have a slightly lower chance.
 * @param {Array<Object>} questionPool - The array of question objects (formulas or categoryChallenges).
 * @param {string} challengeType - '藥材組成' or '藥劑分類'.
 * @returns {Object|null} The selected question object, or null if no questions are available.
 */
function selectWeightedRandomQuestion(questionPool, challengeType) {
    if (questionPool.length === 0) {
        return null;
    }

    let totalWeight = 0;
    const weightedQuestions = questionPool.map(q => {
        // Initialize timesIncorrect and timesAppeared if they don't exist
        const timesIncorrect = q.timesIncorrect || 0;
        const timesAppeared = q.timesAppeared || 0;

        let weight = 1; // Base weight for all questions

        // **權重提升機制：** 回答錯誤的題目，其被選中的機率會大幅提升。
        // 每答錯一次，權重增加5點。這確保了錯題會被優先練習。
        weight += timesIncorrect * 5;

        // **權重降低機制：** 出現次數明顯更多的題目，其被選中的機率會降低。
        // 每出現一次，權重減少0.02點。為了避免權重降得太低，最多計算50次出現的影響。
        // 這樣可以避免某些題目被過度頻繁地選中，尤其是那些總是答對的題目。
        weight -= Math.min(timesAppeared, 50) * 0.02;

        // 確保權重不會低於最小值，避免某些題目永遠不會再出現。
        weight = Math.max(0.1, weight);

        totalWeight += weight;
        return { question: q, weight: weight };
    });

    let randomValue = Math.random() * totalWeight;

    for (let i = 0; i < weightedQuestions.length; i++) {
        randomValue -= weightedQuestions[i].weight;
        if (randomValue <= 0) {
            return weightedQuestions[i].question;
        }
    }
    // Fallback in case floating point precision issues, pick the last one
    return weightedQuestions[weightedQuestions.length - 1].question;
}

/**
 * Updates `timesAppeared` and `timesIncorrect` in Firestore for a question.
 * @param {string} collectionName - 'formulas' or 'formula_categories'.
 * @param {Object} question - The question object to update.
 * @param {boolean} isCorrect - Whether the answer was correct.
 */
async function updateQuestionStats(collectionName, question, isCorrect) {
    if (!firestoreDb || !authReady || userId === 'anonymous' || !currentAppId) {
        console.warn(`Firestore not ready for updating question stats for ${collectionName}.`);
        return;
    }

    const docRef = doc(firestoreDb, `artifacts/${currentAppId}/public/data/${collectionName}`, question.id);
    const newTimesAppeared = (question.timesAppeared || 0) + 1;
    const newTimesIncorrect = isCorrect ? (question.timesIncorrect || 0) : (question.timesIncorrect || 0) + 1;

    try {
        await updateDoc(docRef, {
            timesAppeared: newTimesAppeared,
            timesIncorrect: newTimesIncorrect
        });
        console.log(`Question stats updated for ${question.name} in ${collectionName}: Appeared ${newTimesAppeared}, Incorrect ${newTimesIncorrect}`);
    } catch (e) {
        console.error(`Failed to update stats for question ${question.name} in ${collectionName}:`, e);
        showCustomMessageBox("錯誤", `無法更新題目統計數據：${question.name}。`);
    }
}

// --- Core Ingredient Composition Challenge Logic ---
/**
 * Displays a new ingredient composition question.
 */
function displayQuestion() {
    console.log("displayQuestion() called.");
    if (formulas.length === 0) {
        formulaNameElem.textContent = "沒有可用的題目";
        formulaHintElem.textContent = "請前往「題目管理」新增方劑。";
        noFormulasMessage.classList.remove('hidden');
        userAnswerInput.disabled = true;
        submitAnswerBtn.classList.add('hidden');
        showCorrectAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        return;
    } else {
        noFormulasMessage.classList.add('hidden');
    }

    // Select a question using weighted random selection
    currentFormula = selectWeightedRandomQuestion(formulas, '藥材組成');
    if (!currentFormula) {
        formulaNameElem.textContent = "沒有可用的題目";
        formulaHintElem.textContent = "無法選取題目，請檢查題庫。";
        userAnswerInput.disabled = true; // Disable input if no question
        submitAnswerBtn.classList.add('hidden');
        showCorrectAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        console.log("No currentFormula selected. Exiting displayQuestion.");
        return;
    }

    // Update DOM elements to display the question content first
    formulaNameElem.textContent = currentFormula.name;
    formulaHintElem.textContent = currentFormula.hint ? `提示：${currentFormula.hint}` : '';
    userAnswerInput.value = ''; // Clear user input
    feedbackMessageElem.classList.add('hidden'); // Hide feedback message
    feedbackMessageElem.textContent = '';
    nextQuestionBtn.classList.add('hidden'); // Hide "Next Question" button

    // Now, reset the interactive states
    // This order helps ensure the question content is there before input becomes active
    userAnswerInput.disabled = false; // Enable input
    submitAnswerBtn.classList.remove('hidden'); // Show submit button
    showCorrectAnswerBtn.classList.remove('hidden'); // Show show correct answer button

    // Use a tiny timeout for focus to potentially help with rendering race conditions
    // This addresses the "double-click next" issue by ensuring the browser has time to render
    setTimeout(() => {
        userAnswerInput.focus(); // Auto-focus input field
        console.log(`displayQuestion() finished. Current formula: ${currentFormula.name}. Input disabled: ${userAnswerInput.disabled}, Submit hidden: ${submitAnswerBtn.classList.contains('hidden')}`);
    }, 50); // A very small delay
}

/**
 * Checks the user's answer for the ingredient composition challenge.
 */
async function checkAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前藥材組成題目可供檢查。");
        return;
    }

    const userParsed = parseUserAnswer(userAnswerInput.value);
    const correctParsed = Array.isArray(currentFormula.ingredients) ? currentFormula.ingredients.map(normalizeIngredient) : [];

    // Determine if the answer is completely correct (order doesn't matter)
    const isCorrect = userParsed.length === correctParsed.length &&
                      userParsed.every(ing => correctParsed.includes(ing)) &&
                      correctParsed.every(ing => userParsed.includes(ing));

    feedbackMessageElem.classList.remove('hidden');
    if (isCorrect) {
        feedbackMessageElem.textContent = "恭喜，回答正確！";
        feedbackMessageElem.className = 'text-center text-lg font-medium text-green-600';
        await showCustomMessageBox("正確", "恭喜，回答正確！您對這道方劑瞭若指掌。");
        await removeCorrectedMistake(currentFormula.name, '藥材組成'); // Remove mistake if previously incorrect
        await updateQuestionStats('formulas', currentFormula, true); // Update stats for correct answer
    } else {
        feedbackMessageElem.textContent = `很抱歉，答案不完全正確。\n正確答案是：${(currentFormula.ingredients || []).join('、')}`;
        feedbackMessageElem.className = 'text-center text-lg font-medium text-red-600 whitespace-pre-line';

        await addMistake(currentFormula.name, (currentFormula.ingredients || []).join('、'), '藥材組成'); // Add/update mistake
        await updateQuestionStats('formulas', currentFormula, false); // Update stats for incorrect answer
        await showCustomMessageBox("錯誤", `很抱歉，答案不完全正確。\n正確答案是：${(currentFormula.ingredients || []).join('、')}\n\n這題已加入錯題記錄。`);
    }

    // Lock input and submit button, show next question button
    userAnswerInput.disabled = true;
    submitAnswerBtn.classList.add('hidden');
    showCorrectAnswerBtn.classList.add('hidden'); // Hide show answer button after submission
    nextQuestionBtn.classList.remove('hidden');
}

/**
 * Displays the correct answer for the ingredient composition challenge (user actively clicks).
 */
async function showCorrectAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前藥材組成題目可供顯示答案。");
        return;
    }

    // Display correct answer and add to mistake records
    feedbackMessageElem.classList.remove('hidden');
    feedbackMessageElem.textContent = `正確答案是：${(currentFormula.ingredients || []).join('、')}`;
    feedbackMessageElem.className = 'text-center text-lg font-medium text-yellow-600';

    // Even if the user clicks show answer, consider it incorrect and add to mistake records
    await addMistake(currentFormula.name, (currentFormula.ingredients || []).join('、'), '藥材組成');
    await updateQuestionStats('formulas', currentFormula, false); // Update stats as if incorrect answer

    // Lock input and submit button, show next question button
    userAnswerInput.disabled = true;
    submitAnswerBtn.classList.add('hidden');
    showCorrectAnswerBtn.classList.add('hidden');
    nextQuestionBtn.classList.remove('hidden');
    await showCustomMessageBox("答案揭曉", `這道題的正確答案是：${(currentFormula.ingredients || []).join('、')}\n\n這題已加入錯題記錄。`);
}

/**
 * Adds or updates a mistake record (consolidated) to Firestore or LocalStorage.
 * @param {string} formulaName - The name of the formula.
 * @param {string} correctAnswer - The correct answer.
 * @param {string} challengeType - The type of challenge (e.g., '藥材組成', '藥劑分類').
 */
async function addMistake(formulaName, correctAnswer, challengeType) {
    if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
        // Use Firestore to store
        try {
            const mistakeCollectionRef = collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
            // Query for existing mistake for this formula and type
            const q = query(mistakeCollectionRef,
                where("formulaName", "==", formulaName),
                where("challengeType", "==", challengeType)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // If mistake already exists, update its count
                const docToUpdate = querySnapshot.docs[0];
                const currentCount = docToUpdate.data().count || 0;
                await updateDoc(doc(mistakeCollectionRef, docToUpdate.id), {
                    count: currentCount + 1,
                    lastMistakeTimestamp: new Date().toISOString()
                });
                console.log("Mistake count updated in Firestore.");
            } else {
                // Otherwise, add a new mistake record
                await addDoc(mistakeCollectionRef, {
                    formulaName: formulaName,
                    correctAnswer: correctAnswer,
                    challengeType: challengeType,
                    count: 1, // First mistake
                    firstMistakeTimestamp: new Date().toISOString(),
                    lastMistakeTimestamp: new Date().toISOString()
                });
                console.log("New mistake added to Firestore.");
            }
        } catch (e) {
            console.error("Failed to add/update mistake in Firestore:", e);
            showCustomMessageBox("錯誤", "無法儲存錯題記錄到雲端。");
        }
    } else {
        // Fallback to localStorage
        let existingRecordIndex = mistakeRecords.findIndex(record =>
            record.formulaName === formulaName &&
            record.challengeType === challengeType
        );

        if (existingRecordIndex !== -1) {
            // Update existing record
            mistakeRecords[existingRecordIndex].count = (mistakeRecords[existingRecordIndex].count || 0) + 1;
            mistakeRecords[existingRecordIndex].lastMistakeTimestamp = new Date().toISOString();
        } else {
            // Add new record
            mistakeRecords.push({
                id: `local-mistake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                formulaName: formulaName,
                correctAnswer: correctAnswer,
                challengeType: challengeType,
                count: 1,
                firstMistakeTimestamp: new Date().toISOString(),
                lastMistakeTimestamp: new Date().toISOString()
            });
        }
        saveMistakeRecordsLocal();
        console.log("Mistake added/updated in LocalStorage.");
    }
}

/**
 * Removes a corrected mistake from Firestore or LocalStorage.
 * Decrements count, removes if count is 0.
 * @param {string} formulaName - The name of the formula.
 * @param {string} challengeType - The type of challenge.
 */
async function removeCorrectedMistake(formulaName, challengeType) {
    if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
        try {
            const mistakeCollectionRef = collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
            const q = query(mistakeCollectionRef,
                where("formulaName", "==", formulaName),
                where("challengeType", "==", challengeType)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docToUpdate = querySnapshot.docs[0];
                const currentCount = docToUpdate.data().count || 0;

                if (currentCount > 1) {
                    // Decrement count if more than one mistake
                    await updateDoc(doc(mistakeCollectionRef, docToUpdate.id), {
                        count: currentCount - 1
                    });
                    console.log("Mistake count decremented in Firestore.");
                } else {
                    // Remove record if only one mistake left (or count is 0)
                    await deleteDoc(doc(mistakeCollectionRef, docToUpdate.id));
                    console.log("Mistake record removed from Firestore.");
                }
            }
        } catch (e) {
            console.error("Failed to remove corrected mistake from Firestore:", e);
            showCustomMessageBox("錯誤", "無法更新錯題記錄。");
        }
    } else {
        // Fallback to localStorage
        let existingRecordIndex = mistakeRecords.findIndex(record =>
            record.formulaName === formulaName &&
            record.challengeType === challengeType
        );

        if (existingRecordIndex !== -1) {
            if (mistakeRecords[existingRecordIndex].count > 1) {
                mistakeRecords[existingRecordIndex].count--;
            } else {
                mistakeRecords.splice(existingRecordIndex, 1); // Remove if count is 1
            }
            saveMistakeRecordsLocal();
            console.log("Mistake count decremented/removed in LocalStorage.");
        }
    }
}


// --- Core Classification Challenge Logic ---
/**
 * Displays a new formula classification question.
 */
function displayCategoryQuestion() {
    console.log("displayCategoryQuestion() called.");
    if (categoryChallenges.length === 0) {
        categoryFormulaNameElem.textContent = "沒有可用的題目";
        categoryChallengeHintElem.textContent = "請前往「題目管理」新增藥劑分類題目。";
        noCategoryFormulasMessage.classList.remove('hidden');
        userCategoryAnswerInput.disabled = true;
        submitCategoryAnswerBtn.classList.add('hidden');
        showCorrectCategoryAnswerBtn.classList.add('hidden');
        nextCategoryQuestionBtn.classList.add('hidden');
        return;
    } else {
        noCategoryFormulasMessage.classList.add('hidden');
    }

    currentCategoryChallenge = selectWeightedRandomQuestion(categoryChallenges, '藥劑分類');
    if (!currentCategoryChallenge) {
        categoryFormulaNameElem.textContent = "沒有可用的題目";
        categoryChallengeHintElem.textContent = "無法選取題目，請檢查題庫。";
        userCategoryAnswerInput.disabled = true; // Disable input if no question
        submitCategoryAnswerBtn.classList.add('hidden');
        showCorrectCategoryAnswerBtn.classList.add('hidden');
        nextCategoryQuestionBtn.classList.add('hidden');
        console.log("No currentCategoryChallenge selected. Exiting displayCategoryQuestion.");
        return;
    }

    categoryFormulaNameElem.textContent = currentCategoryChallenge.name;
    categoryChallengeHintElem.textContent = currentCategoryChallenge.hint ? `提示：${currentCategoryChallenge.hint}` : '';
    userCategoryAnswerInput.value = '';
    categoryFeedbackMessageElem.classList.add('hidden');
    categoryFeedbackMessageElem.textContent = '';
    nextCategoryQuestionBtn.classList.add('hidden');

    userCategoryAnswerInput.disabled = false;
    submitCategoryAnswerBtn.classList.remove('hidden');
    showCorrectCategoryAnswerBtn.classList.remove('hidden');

    // Use a tiny timeout for focus to potentially help with rendering race conditions
    // This addresses the "double-click next" issue by ensuring the browser has time to render
    setTimeout(() => {
        userCategoryAnswerInput.focus();
        console.log(`displayCategoryQuestion() finished. Current formula: ${currentCategoryChallenge.name}. Input disabled: ${userCategoryAnswerInput.disabled}, Submit hidden: ${submitCategoryAnswerBtn.classList.contains('hidden')}`);
    }, 50); // A very small delay
}

/**
 * Checks the user's answer for the formula classification challenge.
 */
async function checkCategoryAnswer() {
    if (!currentCategoryChallenge) {
        showCustomMessageBox("錯誤", "沒有當前藥劑分類題目可供檢查。");
        return;
    }

    const userAnswer = normalizeCategory(userCategoryAnswerInput.value);
    const correctAnswer = normalizeCategory(currentCategoryChallenge.category);

    const isCorrect = userAnswer === correctAnswer;

    categoryFeedbackMessageElem.classList.remove('hidden');
    if (isCorrect) {
        categoryFeedbackMessageElem.textContent = "恭喜，回答正確！";
        categoryFeedbackMessageElem.className = 'text-center text-lg font-medium text-green-600';
        await showCustomMessageBox("正確", "恭喜，回答正確！您對這道方劑分類瞭若指掌。");
        await removeCorrectedMistake(currentCategoryChallenge.name, '藥劑分類'); // Remove mistake if previously incorrect
        await updateQuestionStats('formula_categories', currentCategoryChallenge, true); // Update stats for correct answer
    } else {
        categoryFeedbackMessageElem.textContent = `很抱歉，答案不完全正確。\n正確答案是：${currentCategoryChallenge.category}`;
        categoryFeedbackMessageElem.className = 'text-center text-lg font-medium text-red-600 whitespace-pre-line';

        await addMistake(currentCategoryChallenge.name, currentCategoryChallenge.category, '藥劑分類'); // Add/update mistake
        await updateQuestionStats('formula_categories', currentCategoryChallenge, false); // Update stats for incorrect answer
        await showCustomMessageBox("錯誤", `很抱歉，答案不完全正確。\n正確答案是：${currentCategoryChallenge.category}\n\n這題已加入錯題記錄。`);
    }

    userCategoryAnswerInput.disabled = true;
    submitCategoryAnswerBtn.classList.add('hidden');
    showCorrectCategoryAnswerBtn.classList.add('hidden');
    nextCategoryQuestionBtn.classList.remove('hidden');
}

/**
 * Displays the correct answer for the formula classification challenge (user actively clicks).
 */
async function showCorrectCategoryAnswer() {
    if (!currentCategoryChallenge) {
        showCustomMessageBox("錯誤", "沒有當前藥劑分類題目可供顯示答案。");
        return;
    }

    categoryFeedbackMessageElem.classList.remove('hidden');
    categoryFeedbackMessageElem.textContent = `正確答案是：${currentCategoryChallenge.category}`;
    categoryFeedbackMessageElem.className = 'text-center text-lg font-medium text-yellow-600';

    await addMistake(currentCategoryChallenge.name, currentCategoryChallenge.category, '藥劑分類'); // Add/update mistake
    await updateQuestionStats('formula_categories', currentCategoryChallenge, false); // Update stats as if incorrect answer

    userCategoryAnswerInput.disabled = true;
    submitCategoryAnswerBtn.classList.add('hidden');
    showCorrectCategoryAnswerBtn.classList.add('hidden');
    nextCategoryQuestionBtn.classList.remove('hidden');
    await showCustomMessageBox("答案揭曉", `這道題的正確答案是：${currentCategoryChallenge.category}\n\n這題已加入錯題記錄。`);
}


// --- Mistake Records Page Logic ---
/**
 * Renders the consolidated mistake records list.
 */
function renderMistakes() {
    mistakesListElem.innerHTML = ''; // Clear existing list

    if (mistakeRecords.length === 0) {
        noMistakesMessageElem.classList.remove('hidden');
        clearMistakesBtn.classList.add('hidden');
        return;
    } else {
        noMistakesMessageElem.classList.add('hidden');
        clearMistakesBtn.classList.remove('hidden');
    }

    // Sort mistake records by last mistake timestamp, descending
    const sortedMistakes = [...mistakeRecords].sort((a, b) => {
        return new Date(b.lastMistakeTimestamp) - new Date(a.lastMistakeTimestamp);
    });

    sortedMistakes.forEach((record) => {
        const mistakeItem = document.createElement('div');
        mistakeItem.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm relative';
        // Display only formulaName, challengeType, and consolidated count
        mistakeItem.innerHTML = `
            <h3 class="text-xl font-semibold text-blue-800 mb-2 break-words">
                ${record.formulaName} 
                <span class="text-sm font-normal text-gray-500">(${record.challengeType})</span>
            </h3>
            <p class="text-gray-700 mb-1 break-words"><span class="font-medium">錯誤次數：</span> ${record.count || 1}</p>
            <p class="text-gray-700 break-words"><span class="font-medium">正確答案：</span> ${record.correctAnswer}</p>
            <button data-id="${record.id}" class="remove-mistake-btn absolute top-3 right-3 text-red-500 hover:text-red-700 text-2xl font-bold leading-none" title="從記錄中移除">
                &times;
            </button>
        `;
        mistakesListElem.appendChild(mistakeItem);
    });

    // Add event listeners for each remove button
    document.querySelectorAll('.remove-mistake-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const recordIdToRemove = event.target.dataset.id;
            removeMistakeSpecific(recordIdToRemove); // Use a new function for specific removal
        });
    });
}

/**
 * Removes a specific mistake record (by ID) from Firestore or LocalStorage.
 * This is used for the 'x' button in the mistake list.
 * @param {string} recordId - The ID of the record to remove.
 */
async function removeMistakeSpecific(recordId) {
    const confirmRemoval = await showCustomMessageBox("確認移除", "您確定要移除這條錯題記錄嗎？", true);
    if (confirmRemoval) {
        if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`, recordId));
                showCustomMessageBox("完成", "錯題記錄已從雲端移除。");
            } catch (e) {
                console.error("Failed to remove specific mistake from Firestore:", e);
                showCustomMessageBox("錯誤", "無法從雲端移除錯題記錄。");
            }
        } else {
            // Fallback to localStorage removal
            const initialLength = mistakeRecords.length;
            mistakeRecords = mistakeRecords.filter(record => record.id !== recordId);
            if (mistakeRecords.length < initialLength) {
                saveMistakeRecordsLocal();
                showCustomMessageBox("完成", "錯題記錄已從本地移除。");
                renderMistakes(); // Re-render the list
            }
        }
    }
}


/**
 * Clears all mistake records from Firestore or LocalStorage.
 */
async function clearAllMistakes() {
    const confirmClear = await showCustomMessageBox("確認清空", "您確定要清空所有錯題記錄嗎？此操作不可恢復。", true);
    if (confirmClear) {
        if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
            // Clear all mistakes from Firestore (iterative deletion)
            try {
                // Fetch all documents in the collection and delete them one by one
                const q = query(collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`));
                const querySnapshot = await getDocs(q);
                const deletePromises = [];
                querySnapshot.forEach((doc) => {
                    deletePromises.push(deleteDoc(doc.ref));
                });
                await Promise.all(deletePromises);
                showCustomMessageBox("完成", "所有錯題記錄已從雲端清空。");
            } catch (e) {
                console.error("Failed to clear all Firestore mistakes:", e);
                showCustomMessageBox("錯誤", "無法清空雲端錯題記錄。");
            }
        } else {
            // Fallback to localStorage
            mistakeRecords = [];
            saveMistakeRecordsLocal();
            showCustomMessageBox("完成", "所有錯題記錄已從本地清空。");
            renderMistakes(); // Re-render the list
        }
    }
}

// --- Ingredient Composition Question Management Logic ---
/**
 * Renders the management list for ingredient composition questions, with search functionality.
 * @param {string} [searchText=''] - The search keyword. If empty, all questions are displayed.
 */
function renderManagedFormulas(searchText = '') {
    formulaListElem.innerHTML = '';
    let filteredFormulas = formulas;

    if (searchText) {
        const normalizedSearchText = searchText.toLowerCase().trim();
        filteredFormulas = formulas.filter(formula =>
            (formula.name || '').toLowerCase().includes(normalizedSearchText)
        );
    }

    if (filteredFormulas.length === 0) {
        noManagedFormulasMessage.classList.remove('hidden');
    } else {
        noManagedFormulasMessage.classList.add('hidden');
    }

    filteredFormulas.forEach(formula => {
        const formulaItem = document.createElement('div');
        formulaItem.className = 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0';
        formulaItem.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-semibold text-blue-800 break-words">${formula.name}</h3>
                <p class="text-gray-700 text-sm break-words">${(formula.ingredients || []).join('、')}</p>
                <p class="text-gray-600 text-xs italic break-words">${formula.hint || ''}</p>
                <p class="text-gray-500 text-xs mt-1">出題次數: ${formula.timesAppeared || 0}, 答錯次數: ${formula.timesIncorrect || 0}</p>
            </div>
            <div class="flex space-x-2 mt-2 md:mt-0">
                <button data-id="${formula.id}" class="edit-formula-btn bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-300">
                    編輯
                </button>
                <button data-id="${formula.id}" class="delete-formula-btn bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-300">
                    刪除
                </button>
            </div>
        `;
        formulaListElem.appendChild(formulaItem);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('#formula-list .edit-formula-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const formulaId = event.target.dataset.id;
            openFormulaModal(formulaId);
        });
    });

    document.querySelectorAll('#formula-list .delete-formula-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const formulaId = event.target.dataset.id;
            deleteFormula(formulaId);
        });
    });
}

/**
 * Opens the add/edit ingredient composition question modal.
 * @param {string|null} formulaId - The ID of the formula to edit. If null, it's add mode.
 */
function openFormulaModal(formulaId = null) {
    formulaForm.reset(); // Reset form
    formulaModal.dataset.editId = formulaId; // Store current edit ID

    if (formulaId) {
        formulaModalTitle.textContent = "編輯藥材組成題目";
        const formulaToEdit = formulas.find(f => f.id === formulaId);
        if (formulaToEdit) {
            formulaNameInput.value = formulaToEdit.name || '';
            formulaIngredientsInput.value = (formulaToEdit.ingredients || []).join(', ');
            formulaHintInput.value = formulaToEdit.hint || '';
        }
    } else {
        formulaModalTitle.textContent = "新增藥材組成題目";
        formulaModal.dataset.editId = ''; // Ensure no edit ID in add mode
    }
    formulaModal.classList.remove('hidden');
}

/**
 * Closes the add/edit ingredient composition question modal.
 */
function closeFormulaModal() {
    formulaModal.classList.add('hidden');
    formulaModal.dataset.editId = ''; // Clear edit ID
}

/**
 * Handles form submission for adding/editing ingredient composition questions.
 */
formulaForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = formulaNameInput.value.trim();
    const ingredients = formulaIngredientsInput.value.split(/[,，\s]+/).map(i => i.trim()).filter(i => i !== '');
    const hint = formulaHintInput.value.trim();

    if (!name || ingredients.length === 0) {
        await showCustomMessageBox("輸入錯誤", "方劑名稱和藥材組成是必填項！");
        return;
    }

    // Include timesAppeared and timesIncorrect, preserving existing values if editing
    const existingFormula = formulas.find(f => f.id === formulaModal.dataset.editId);
    const formulaData = {
        name,
        ingredients,
        hint,
        timesAppeared: existingFormula ? (existingFormula.timesAppeared || 0) : 0,
        timesIncorrect: existingFormula ? (existingFormula.timesIncorrect || 0) : 0
    };

    const editId = formulaModal.dataset.editId; // Get edit ID from data-edit-id

    if (firestoreDb && authReady && currentAppId) {
        try {
            if (editId) {
                // Edit existing formula
                await setDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`, editId), formulaData);
                await showCustomMessageBox("成功", "藥材組成題目更新成功！");
            } else {
                // Add new formula
                await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`), formulaData);
                await showCustomMessageBox("成功", "新藥材組成題目新增成功！");
            }
            closeFormulaModal();
        } catch (e) {
            console.error("Failed to save ingredient composition question:", e);
            await showCustomMessageBox("錯誤", "儲存藥材組成題目失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // Fallback to localStorage
        if (editId) {
            const index = formulas.findIndex(f => f.id === editId);
            if (index !== -1) {
                formulas[index] = { ...formulaData, id: editId };
                await showCustomMessageBox("成功", "藥材組成題目已在本地更新！");
            } else {
                 await showCustomMessageBox("錯誤", "本地編輯失敗：找不到要編輯的藥材組成題目。");
            }
        } else {
            // Add new local formula, generate a more unique ID
            formulas.push({ ...formulaData, id: `local-formula-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            await showCustomMessageBox("成功", "新藥材組成題目已在本地新增！");
        }
        localStorage.setItem('localFormulas', JSON.stringify(formulas)); // Save to local storage
        renderManagedFormulas(formulaSearchInput.value); // Re-render, including any search filter
        closeFormulaModal();
    }
});

/**
 * Initiates the ingredient composition question editing process.
 * @param {string} formulaId - The ID of the formula to edit.
 */
function editFormula(formulaId) {
    openFormulaModal(formulaId);
}

/**
 * Initiates the ingredient composition question deletion process.
 * @param {string} formulaId - The ID of the formula to delete.
 */
async function deleteFormula(formulaId) {
    const formulaToDelete = formulas.find(f => f.id === formulaId);
    const confirmDeletion = await showCustomMessageBox("確認刪除", `您確定要刪除藥材組成題目「${formulaToDelete ? formulaToDelete.name : '未知方劑'}」嗎？此操作不可恢復。`, true);
    if (confirmDeletion) {
        if (firestoreDb && authReady && currentAppId) {
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`, formulaId));
                await showCustomMessageBox("成功", "藥材組成題目刪除成功！");
            } catch (e) {
                console.error("Failed to delete ingredient composition question:", e);
                await showCustomMessageBox("錯誤", "刪除藥材組成題目失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // Fallback to localStorage deletion
            const initialLength = formulas.length;
            formulas = formulas.filter(f => f.id !== formulaId);
            if (formulas.length < initialLength) {
                localStorage.setItem('localFormulas', JSON.stringify(formulas));
                await showCustomMessageBox("成功", "藥材組成題目已從本地刪除！");
                renderManagedFormulas(formulaSearchInput.value); // Re-render, including any search filter
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的藥材組成題目。");
            }
        }
    }
}


// --- Classification Question Management Logic ---
/**
 * Renders the management list for classification questions, with search functionality.
 * @param {string} [searchText=''] - The search keyword. If empty, all questions are displayed.
 */
function renderManagedCategories(searchText = '') {
    categoryChallengeListElem.innerHTML = '';
    let filteredCategories = categoryChallenges;

    if (searchText) {
        const normalizedSearchText = searchText.toLowerCase().trim();
        filteredCategories = categoryChallenges.filter(challenge =>
            (challenge.name || '').toLowerCase().includes(normalizedSearchText)
        );
    }

    if (filteredCategories.length === 0) {
        noManagedCategoryChallengesMessage.classList.remove('hidden');
    } else {
        noManagedCategoryChallengesMessage.classList.add('hidden');
    }

    filteredCategories.forEach(challenge => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0';
        categoryItem.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-semibold text-blue-800 break-words">${challenge.name}</h3>
                <p class="text-gray-700 text-sm break-words"><span class="font-medium">分類：</span> ${challenge.category}</p>
                <p class="text-gray-600 text-xs italic break-words">${challenge.hint || ''}</p>
                <p class="text-gray-500 text-xs mt-1">出題次數: ${challenge.timesAppeared || 0}, 答錯次數: ${challenge.timesIncorrect || 0}</p>
            </div>
            <div class="flex space-x-2 mt-2 md:mt-0">
                <button data-id="${challenge.id}" class="edit-category-btn bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-300">
                    編輯
                </button>
                <button data-id="${challenge.id}" class="delete-category-btn bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-300">
                    刪除
                </button>
            </div>
        `;
        categoryChallengeListElem.appendChild(categoryItem);
    });

    document.querySelectorAll('#category-challenge-list .edit-category-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const challengeId = event.target.dataset.id;
            openCategoryModal(challengeId);
        });
    });

    document.querySelectorAll('#category-challenge-list .delete-category-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const challengeId = event.target.dataset.id;
            deleteCategory(challengeId);
        });
    });
}

/**
 * Opens the add/edit classification question modal.
 * @param {string|null} challengeId - The ID of the formula classification to edit. If null, it's add mode.
 */
function openCategoryModal(challengeId = null) {
    categoryForm.reset();
    categoryModal.dataset.editId = challengeId;

    if (challengeId) {
        categoryModalTitle.textContent = "編輯藥劑分類題目";
        const challengeToEdit = categoryChallenges.find(c => c.id === challengeId);
        if (challengeToEdit) {
            categoryFormulaNameInput.value = challengeToEdit.name || '';
            categoryAnswerInput.value = challengeToEdit.category || '';
            categoryHintInput.value = challengeToEdit.hint || '';
        }
    } else {
        categoryModalTitle.textContent = "新增藥劑分類題目";
        categoryModal.dataset.editId = '';
    }
    categoryModal.classList.remove('hidden');
}

/**
 * Closes the add/edit classification question modal.
 */
function closeCategoryModal() {
    categoryModal.classList.add('hidden');
    categoryModal.dataset.editId = '';
}

/**
 * Handles form submission for adding/editing classification questions.
 */
categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = categoryFormulaNameInput.value.trim();
    const category = categoryAnswerInput.value.trim();
    const hint = categoryHintInput.value.trim();

    if (!name || !category) {
        await showCustomMessageBox("輸入錯誤", "方劑名稱和正確分類是必填項！");
        return;
    }

    // Include timesAppeared and timesIncorrect, preserving existing values if editing
    const existingChallenge = categoryChallenges.find(c => c.id === categoryModal.dataset.editId);
    const challengeData = {
        name,
        category,
        hint,
        timesAppeared: existingChallenge ? (existingChallenge.timesAppeared || 0) : 0,
        timesIncorrect: existingChallenge ? (existingChallenge.timesIncorrect || 0) : 0
    };

    const editId = categoryModal.dataset.editId;

    if (firestoreDb && authReady && currentAppId) {
        try {
            if (editId) {
                await setDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formula_categories`, editId), challengeData);
                await showCustomMessageBox("成功", "藥劑分類題目更新成功！");
            } else {
                await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/public/data/formula_categories`), challengeData);
                await showCustomMessageBox("成功", "新藥劑分類題目新增成功！");
            }
            closeCategoryModal();
        } catch (e) {
            console.error("Failed to save classification question:", e);
            await showCustomMessageBox("錯誤", "儲存藥劑分類題目失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // Fallback to localStorage
        if (editId) {
            const index = categoryChallenges.findIndex(c => c.id === editId);
            if (index !== -1) {
                categoryChallenges[index] = { ...challengeData, id: editId };
                await showCustomMessageBox("成功", "藥劑分類題目已在本地更新！");
            } else {
                await showCustomMessageBox("錯誤", "本地編輯失敗：找不到要編輯的藥劑分類題目。");
            }
        } else {
            categoryChallenges.push({ ...challengeData, id: `local-category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            await showCustomMessageBox("成功", "新藥劑分類題目已在本地新增！");
        }
        localStorage.setItem('localCategoryChallenges', JSON.stringify(categoryChallenges));
        renderManagedCategories(categorySearchInput.value); // Re-render, including any search filter
        closeCategoryModal();
    }
});

/**
 * Initiates the classification question deletion process.
 * @param {string} challengeId - The ID of the formula classification to delete.
 */
async function deleteCategory(challengeId) {
    const challengeToDelete = categoryChallenges.find(c => c.id === challengeId);
    const confirmDeletion = await showCustomMessageBox("確認刪除", `您確定要刪除藥劑分類題目「${challengeToDelete ? challengeToDelete.name : '未知方劑'}」嗎？此操作不可恢復。`, true);
    if (confirmDeletion) {
        if (firestoreDb && authReady && currentAppId) {
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formula_categories`, challengeId));
                await showCustomMessageBox("成功", "藥劑分類題目刪除成功！");
            } catch (e) {
                console.error("Failed to delete classification question:", e);
                await showCustomMessageBox("錯誤", "刪除藥劑分類題目失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // Fallback to localStorage deletion
            const initialLength = categoryChallenges.length;
            categoryChallenges = categoryChallenges.filter(c => c.id !== challengeId);
            if (categoryChallenges.length < initialLength) {
                localStorage.setItem('localCategoryChallenges', JSON.stringify(categoryChallenges));
                await showCustomMessageBox("成功", "藥劑分類題目已從本地刪除！");
                renderManagedCategories(categorySearchInput.value); // Re-render, including any search filter
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的藥劑分類題目。");
            }
        }
    }
}


// --- Formula Introduction Section Logic ---
/**
 * Renders the list of formula introduction cards, supporting category filtering and search.
 * @param {string} categoryFilter - The current category filter. '全部' means no filter.
 * @param {string} searchText - The search keyword for formula names.
 */
function renderFormulaIntroductions(categoryFilter = '全部', searchText = '') {
    formulaIntroductionsList.innerHTML = '';
    let filteredIntros = formulaIntroductions;

    // 1. Filter by category
    if (categoryFilter !== '全部') {
        filteredIntros = filteredIntros.filter(intro => normalizeCategory(intro.category) === normalizeCategory(categoryFilter));
    }

    // 2. Filter by search text
    if (searchText) {
        const normalizedSearchText = searchText.toLowerCase().trim();
        filteredIntros = filteredIntros.filter(intro =>
            (intro.name || '').toLowerCase().includes(normalizedSearchText)
        );
    }

    if (filteredIntros.length === 0) {
        noIntroductionsMessage.classList.remove('hidden');
    } else {
        noIntroductionsMessage.classList.add('hidden');
    }

    filteredIntros.forEach(intro => {
        const introCard = document.createElement('div');
        introCard.className = 'bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-200 relative';
        introCard.innerHTML = `
            <h3 class="text-2xl font-bold text-blue-700 mb-2 break-words">${intro.name}</h3>
            <p class="text-sm font-semibold text-gray-600 mb-3">${intro.category ? `分類：${intro.category}` : ''}</p>
            ${intro.ingredients ? `<p class="text-gray-700 text-sm mb-2 break-words"><strong>藥材：</strong> ${intro.ingredients}</p>` : ''}
            <p class="text-gray-800 mb-2 break-words"><strong>主治：</strong> ${intro.indications || '無'}</p>
            <p class="text-gray-800 break-words"><strong>效果：：</strong> ${intro.effects || '無'}</p>
            <!-- Edit/delete buttons are not displayed in the intro section itself, moved to management -->
        `;
        formulaIntroductionsList.appendChild(introCard);
    });

    // No event listeners for edit/delete buttons here as they are in the management section
}

/**
 * Renders the category filter buttons for the formula introduction section.
 */
function renderFormulaCategoriesFilter() {
    categoryFilterContainer.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.className = `category-filter-btn px-4 py-2 rounded-lg font-semibold transition duration-300 active:scale-95 mb-2 md:mb-0 ${currentFormulaIntroCategoryFilter === '全部' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
    allButton.textContent = '全部';
    allButton.dataset.category = '全部';
    categoryFilterContainer.appendChild(allButton);

    allCategories.forEach(category => {
        if (category.trim() === '') return; // Avoid empty category buttons
        const button = document.createElement('button');
        button.className = `category-filter-btn px-4 py-2 rounded-lg font-semibold transition duration-300 active:scale-95 mb-2 md:mb-0 ${currentFormulaIntroCategoryFilter === category ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
        button.textContent = category;
        button.dataset.category = category;
        categoryFilterContainer.appendChild(button);
    });

    // Add event listeners for all category filter buttons
    document.querySelectorAll('.category-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const selectedCategory = event.target.dataset.category;
            currentFormulaIntroCategoryFilter = selectedCategory; // Update selected category
            renderFormulaIntroductions(selectedCategory, introSearchInput.value); // Re-render cards
            // Update button styles
            document.querySelectorAll('.category-filter-btn').forEach(btn => {
                if (btn.dataset.category === selectedCategory) {
                    btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
                    btn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
                } else {
                    btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                    btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
                }
            });
        });
    });
}


/**
 * Opens the add/edit formula introduction modal.
 * @param {string|null} introId - The ID of the introduction card to edit. If null, it's add mode.
 */
function openFormulaIntroModal(introId = null) {
    formulaIntroForm.reset();
    formulaIntroModal.dataset.editId = introId;

    if (introId) {
        formulaIntroModalTitle.textContent = "編輯方劑介紹";
        const introToEdit = formulaIntroductions.find(i => i.id === introId);
        if (introToEdit) {
            introFormulaNameInput.value = introToEdit.name || '';
            introCategoryInput.value = introToEdit.category || '';
            introIngredientsInput.value = introToEdit.ingredients || '';
            introIndicationsInput.value = introToEdit.indications || '';
            introEffectsInput.value = introToEdit.effects || '';
        }
    } else {
        formulaIntroModalTitle.textContent = "新增方劑介紹";
        formulaIntroModal.dataset.editId = '';
    }
    formulaIntroModal.classList.remove('hidden');
}

/**
 * Closes the add/edit formula introduction modal.
 */
function closeFormulaIntroModal() {
    formulaIntroModal.classList.add('hidden');
    formulaIntroModal.dataset.editId = '';
}

/**
 * Handles form submission for adding/editing formula introductions.
 */
formulaIntroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = introFormulaNameInput.value.trim();
    const category = introCategoryInput.value.trim();
    const ingredients = introIngredientsInput.value.trim();
    const indications = introIndicationsInput.value.trim();
    const effects = introEffectsInput.value.trim();

    if (!name || !category || !indications || !effects) {
        await showCustomMessageBox("輸入錯誤", "方劑名稱、分類、主治、效果是必填項！");
        return;
    }

    const introData = { name, category, ingredients, indications, effects };
    const editId = formulaIntroModal.dataset.editId;

    if (firestoreDb && authReady && currentAppId) {
        try {
            if (editId) {
                await setDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formula_introductions`, editId), introData);
                await showCustomMessageBox("成功", "方劑介紹更新成功！");
            } else {
                await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/public/data/formula_introductions`), introData);
                await showCustomMessageBox("成功", "新方劑介紹新增成功！");
            }
            closeFormulaIntroModal();
        } catch (e) {
            console.error("Failed to save formula introduction:", e);
            await showCustomMessageBox("錯誤", "儲存方劑介紹失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // Fallback to localStorage
        if (editId) {
            const index = formulaIntroductions.findIndex(i => i.id === editId);
            if (index !== -1) {
                formulaIntroductions[index] = { ...introData, id: editId };
                await showCustomMessageBox("成功", "方劑介紹已在本地更新！");
            } else {
                await showCustomMessageBox("錯誤", "本地編輯失敗：找不到要編輯的方劑介紹。");
            }
        } else {
            formulaIntroductions.push({ ...introData, id: `local-intro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            await showCustomMessageBox("成功", "新方劑介紹已在本地新增！");
        }
        localStorage.setItem('localFormulaIntroductions', JSON.stringify(formulaIntroductions));
        renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // Re-render intro section cards
        renderManagedFormulaIntroductions(managedIntroSearchInput.value); // Re-render management section cards
        closeFormulaIntroModal();
    }
});

/**
 * Initiates the deletion process for a formula introduction.
 * @param {string} introId - The ID of the introduction card to delete.
 */
async function deleteFormulaIntro(introId) {
    const introToDelete = formulaIntroductions.find(i => i.id === introId);
    const confirmDeletion = await showCustomMessageBox("確認刪除", `您確定要刪除方劑介紹「${introToDelete ? introToDelete.name : '未知方劑'}」嗎？此操作不可恢復。`, true);
    if (confirmDeletion) {
        if (firestoreDb && authReady && currentAppId) {
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formula_introductions`, introId));
                await showCustomMessageBox("成功", "方劑介紹刪除成功！");
            } catch (e) {
                console.error("Failed to delete formula introduction:", e);
                await showCustomMessageBox("錯誤", "刪除方劑介紹失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // Fallback to localStorage deletion
            const initialLength = formulaIntroductions.length;
            formulaIntroductions = formulaIntroductions.filter(i => i.id !== introId);
            if (formulaIntroductions.length < initialLength) {
                localStorage.setItem('localFormulaIntroductions', JSON.stringify(formulaIntroductions));
                await showCustomMessageBox("成功", "方劑介紹已從本地刪除！");
                renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // Re-render intro section cards
                renderManagedFormulaIntroductions(managedIntroSearchInput.value); // Re-render management section cards
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的方劑介紹。");
            }
        }
    }
}


// --- Managed Formula Introductions Logic (New Section for Management) ---
/**
 * Renders the management list for formula introduction cards, with search functionality.
 * @param {string} [searchText=''] - The search keyword. If empty, all cards are displayed.
 */
function renderManagedFormulaIntroductions(searchText = '') {
    managedFormulaIntroductionsList.innerHTML = '';
    let filteredIntros = formulaIntroductions;

    if (searchText) {
        const normalizedSearchText = searchText.toLowerCase().trim();
        filteredIntros = formulaIntroductions.filter(intro =>
            (intro.name || '').toLowerCase().includes(normalizedSearchText)
        );
    }

    if (filteredIntros.length === 0) {
        noManagedIntroductionsMessage.classList.remove('hidden');
    } else {
        noManagedIntroductionsMessage.classList.add('hidden');
    }

    filteredIntros.forEach(intro => {
        const introItem = document.createElement('div');
        introItem.className = 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0';
        introItem.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-semibold text-blue-800 break-words">${intro.name}</h3>
                <p class="text-gray-700 text-sm break-words"><span class="font-medium">分類：</span> ${intro.category}</p>
                <p class="text-gray-600 text-xs italic break-words">主治：${(intro.indications || '').substring(0, 50)}${(intro.indications || '').length > 50 ? '...' : ''}</p>
            </div>
            <div class="flex space-x-2 mt-2 md:mt-0">
                <button data-id="${intro.id}" class="edit-managed-intro-btn bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-300">
                    編輯
                </button>
                <button data-id="${intro.id}" class="delete-managed-intro-btn bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-300">
                    刪除
                </button>
            </div>
        `;
        managedFormulaIntroductionsList.appendChild(introItem);
    });

    document.querySelectorAll('#managed-formula-introductions-list .edit-managed-intro-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const introId = event.target.dataset.id;
            openFormulaIntroModal(introId);
        });
    });

    document.querySelectorAll('#managed-formula-introductions-list .delete-managed-intro-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const introId = event.target.dataset.id;
            deleteFormulaIntro(introId);
        });
    });
}


// --- Autocomplete Functions ---
/**
 * Displays autocomplete suggestions based on input for ingredient composition challenge.
 * @param {string} input - The text typed by the user in the input box.
 */
function showAutocompleteSuggestions(input) {
    autocompleteResults.innerHTML = '';
    const typedText = input.toLowerCase().trim();
    if (typedText.length === 0) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    // Find the last incomplete ingredient part
    const lastCommaIndex = Math.max(input.lastIndexOf(','), input.lastIndexOf('，'), input.lastIndexOf(' '));
    const currentPart = input.substring(lastCommaIndex + 1).trim();

    if (currentPart.length === 0) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    const suggestions = allIngredients.filter(ing =>
        normalizeIngredient(ing).startsWith(normalizeIngredient(currentPart))
    );

    if (suggestions.length > 0) {
        suggestions.slice(0, 10).forEach(suggestion => { // Display up to 10 suggestions
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'p-2 cursor-pointer hover:bg-blue-100 rounded-lg text-gray-800';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                const existingPart = input.substring(0, lastCommaIndex + 1);
                userAnswerInput.value = existingPart + suggestion + ', ';
                autocompleteResults.classList.add('hidden');
                userAnswerInput.focus(); // Keep focus on the input box
            });
            autocompleteResults.appendChild(suggestionItem);
        });
        autocompleteResults.classList.remove('hidden');
    } else {
        autocompleteResults.classList.add('hidden');
    }
}

/**
 * Displays autocomplete suggestions based on input for classification challenge and formula introduction add/edit.
 * @param {HTMLInputElement} inputElement - The input field element bound to autocomplete.
 * @param {HTMLElement} resultsContainer - The container element for autocomplete results.
 * @param {string} input - The text typed by the user in the input box.
 */
function showCategoryAutocompleteSuggestions(inputElement, resultsContainer, input) {
    resultsContainer.innerHTML = '';
    const typedText = input.toLowerCase().trim();
    if (typedText.length === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }

    const suggestions = allCategories.filter(cat =>
        normalizeCategory(cat).startsWith(typedText)
    );

    if (suggestions.length > 0) {
        suggestions.slice(0, 10).forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'p-2 cursor-pointer hover:bg-blue-100 rounded-lg text-gray-800';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                inputElement.value = suggestion;
                resultsContainer.classList.add('hidden');
                inputElement.focus();
            });
            resultsContainer.appendChild(suggestionItem);
        });
        resultsContainer.classList.remove('hidden');
    } else {
        resultsContainer.classList.add('hidden');
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    showLoadingSpinner();
    initializeFirebase(); // Start Firebase initialization and authentication
    // IMPORTANT: Removed direct displayQuestion() call here.
    // The initial question will be displayed when the user clicks the challenge button.
});

showQuizBtn.addEventListener('click', () => {
    showSection(quizSection);
    displayQuestion(); // Reload question when switching to ingredient composition challenge page
});

showCategoryChallengeBtn.addEventListener('click', () => {
    showSection(categoryChallengeSection);
    displayCategoryQuestion(); // Reload question when switching to classification challenge page
});

showFormulaIntroBtn.addEventListener('click', () => {
    showSection(formulaIntroSection);
    // When entering the formula introduction section, clear search box and re-render all cards
    introSearchInput.value = '';
    currentFormulaIntroCategoryFilter = '全部'; // Reset category filter
    renderFormulaCategoriesFilter(); // Render filter buttons
    renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // Render introduction cards
});

showMistakesBtn.addEventListener('click', () => {
    showSection(mistakesSection);
    renderMistakes(); // Render mistake records when switching to mistake records page
});

showManageBtn.addEventListener('click', () => {
    showSection(manageSection);
    // When entering the management page, clear all search boxes and re-render all questions
    formulaSearchInput.value = '';
    categorySearchInput.value = '';
    managedIntroSearchInput.value = '';
    renderManagedFormulas(''); // Load ingredient composition question management list (without search filter)
    renderManagedCategories(''); // Load classification question management list (without search filter)
    renderManagedFormulaIntroductions(''); // Load formula introduction card management list (without search filter)
});

// Ingredient Composition Challenge Buttons
submitAnswerBtn.addEventListener('click', checkAnswer);
showCorrectAnswerBtn.addEventListener('click', showCorrectAnswer);
nextQuestionBtn.addEventListener('click', displayQuestion);

// Classification Challenge Buttons
submitCategoryAnswerBtn.addEventListener('click', checkCategoryAnswer);
showCorrectCategoryAnswerBtn.addEventListener('click', showCorrectCategoryAnswer);
nextCategoryQuestionBtn.addEventListener('click', displayCategoryQuestion);

// Mistake Records Buttons
clearMistakesBtn.addEventListener('click', clearAllMistakes);

// Management Add Buttons
addFormulaBtn.addEventListener('click', () => openFormulaModal()); // Open add ingredient composition question mode
addCategoryChallengeBtn.addEventListener('click', () => openCategoryModal()); // Open add classification question mode
addManagedFormulaIntroBtn.addEventListener('click', () => openFormulaIntroModal()); // Open add formula introduction mode from management section

// Modal Cancel Buttons
cancelFormulaBtn.addEventListener('click', closeFormulaModal);
cancelCategoryBtn.addEventListener('click', closeCategoryModal);
cancelIntroBtn.addEventListener('click', closeFormulaIntroModal);

// Input field listeners for autocomplete
userAnswerInput.addEventListener('input', (event) => {
    showAutocompleteSuggestions(event.target.value);
});
userCategoryAnswerInput.addEventListener('input', (event) => {
    showCategoryAutocompleteSuggestions(userCategoryAnswerInput, categoryAutocompleteResults, event.target.value);
});
introCategoryInput.addEventListener('input', (event) => {
    showCategoryAutocompleteSuggestions(introCategoryInput, introCategoryAutocompleteResults, event.target.value);
});


// Search input listeners for management sections
formulaSearchInput.addEventListener('input', (event) => {
    renderManagedFormulas(event.target.value);
});
categorySearchInput.addEventListener('input', (event) => {
    renderManagedCategories(event.target.value);
});
managedIntroSearchInput.addEventListener('input', (event) => { // New: search for managed introduction cards
    renderManagedFormulaIntroductions(event.target.value);
});
introSearchInput.addEventListener('input', (event) => { // Search for formula introduction section
    renderFormulaIntroductions(currentFormulaIntroCategoryFilter, event.target.value);
});


// Hide autocomplete list when clicking outside input fields
document.addEventListener('click', (event) => {
    // Hide autocomplete results for ingredient composition challenge
    if (!userAnswerInput.contains(event.target) && !autocompleteResults.contains(event.target)) {
        autocompleteResults.classList.add('hidden');
    }
    // Hide autocomplete results for classification challenge
    if (!userCategoryAnswerInput.contains(event.target) && !categoryAutocompleteResults.contains(event.target)) {
        categoryAutocompleteResults.classList.add('hidden');
    }
    // Hide autocomplete results for formula introduction category input
    if (!introCategoryInput.contains(event.target) && !introCategoryAutocompleteResults.contains(event.target)) {
        introCategoryAutocompleteResults.classList.add('hidden');
    }
});

// Hide autocomplete list when pressing Esc key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        autocompleteResults.classList.add('hidden');
        categoryAutocompleteResults.classList.add('hidden');
        introCategoryAutocompleteResults.classList.add('hidden');
    }
});


// Handle Enter key to submit answer instead of new line (Ingredient Composition Challenge)
userAnswerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter can still create a new line
        event.preventDefault(); // Prevent default newline behavior
        if (!nextQuestionBtn.classList.contains('hidden')) { // If "Next Question" button is visible, switch to next question
            nextQuestionBtn.click();
        } else if (!submitAnswerBtn.classList.contains('hidden')) { // Otherwise, submit answer
            submitAnswerBtn.click();
        }
    }
});

// Handle Enter key to submit answer instead of new line (Classification Challenge)
userCategoryAnswerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter can still create a new line
        event.preventDefault(); // Prevent default newline behavior
        if (!nextCategoryQuestionBtn.classList.contains('hidden')) {
            nextCategoryQuestionBtn.click();
        } else if (!submitCategoryAnswerBtn.classList.contains('hidden')) {
            submitCategoryAnswerBtn.click();
        }
    }
});
