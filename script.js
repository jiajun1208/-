// 導入 Firebase 模組 (使用完整的 CDN URL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, updateDoc, deleteDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =====================================================================
// 請在此處貼上您的 Firebase 專案配置！
// 您可以在 Firebase Console (console.firebase.google.com)
// 選擇您的專案 -> 專案設定 -> 一般 -> 您的應用程式，找到這個配置物件。
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


// Firebase 服務實例將儲存在這些模組作用域變數中
let firestoreDb = null;
let firebaseAuth = null;
let firebaseAppInstance = null; // 用於儲存 Firebase app 實例
let currentAppId = null; // 從 firebaseConfig.projectId 獲取

// 應用程式狀態變數 (模組作用域)
let userId = 'anonymous'; // 當前使用者 ID
let authReady = false; // 標誌，表示 Firebase 認證是否準備就緒
let currentFormulaIntroCategoryFilter = '全部'; // 用於方劑介紹區的當前篩選類別

// --- DOM 元素獲取 ---
const userInfoElem = document.getElementById('user-info');
const showQuizBtn = document.getElementById('show-quiz-btn');
const showCategoryChallengeBtn = document.getElementById('show-category-challenge-btn');
const showFormulaIntroBtn = document.getElementById('show-formula-intro-btn'); // 新增
const showMistakesBtn = document.getElementById('show-mistakes-btn');
const showManageBtn = document.getElementById('show-manage-btn');
const loadingSpinner = document.getElementById('loading-spinner');

// Quiz Section elements (藥材組成挑戰)
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

// Category Challenge Section elements (藥劑分類大挑戰)
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

// Formula Introduction Section elements (方劑卡片介紹區)
const formulaIntroSection = document.getElementById('formula-intro-section'); // 新增
const categoryFilterContainer = document.getElementById('category-filter-container'); // 新增
const introSearchInput = document.getElementById('intro-search-input'); // 新增
const addFormulaIntroBtnTop = document.getElementById('add-formula-intro-btn-top'); // 新增
const formulaIntroductionsList = document.getElementById('formula-introductions-list'); // 新增
const noIntroductionsMessage = document.getElementById('no-introductions-message'); // 新增


// Mistakes Section elements
const mistakesSection = document.getElementById('mistakes-section');
const mistakesListElem = document.getElementById('mistakes-list');
const clearMistakesBtn = document.getElementById('clear-mistakes-btn');
const noMistakesMessageElem = document.getElementById('no-mistakes-message');

// Manage Section elements
const manageSection = document.getElementById('manage-section');
const formulaSearchInput = document.getElementById('formula-search-input'); // 新增
const addFormulaBtn = document.getElementById('add-formula-btn');
const formulaListElem = document.getElementById('formula-list');
const noManagedFormulasMessage = document.getElementById('no-managed-formulas-message');
const categorySearchInput = document.getElementById('category-search-input'); // 新增
const addCategoryChallengeBtn = document.getElementById('add-category-challenge-btn'); // 新增
const categoryChallengeListElem = document.getElementById('category-challenge-list'); // 新增
const noManagedCategoryChallengesMessage = document.getElementById('no-managed-category-challenges-message'); // 新增

// Formula Modal elements (藥材組成題目彈窗)
const formulaModal = document.getElementById('formula-modal');
const formulaModalTitle = document.getElementById('formula-modal-title');
const formulaForm = document.getElementById('formula-form');
const formulaNameInput = document.getElementById('formula-name-input');
const formulaIngredientsInput = document.getElementById('formula-ingredients-input');
const formulaHintInput = document.getElementById('formula-hint-input');
const cancelFormulaBtn = document.getElementById('cancel-formula-btn');

// Category Modal elements (藥劑分類題目彈窗)
const categoryModal = document.getElementById('category-modal');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryForm = document.getElementById('category-form');
const categoryFormulaNameInput = document.getElementById('category-formula-name-input');
const categoryAnswerInput = document.getElementById('category-answer-input');
const categoryHintInput = document.getElementById('category-hint-input');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');

// Formula Intro Modal elements (方劑介紹彈窗)
const formulaIntroModal = document.getElementById('formula-intro-modal'); // 新增
const formulaIntroModalTitle = document.getElementById('formula-intro-modal-title'); // 新增
const formulaIntroForm = document.getElementById('formula-intro-form'); // 新增
const introFormulaNameInput = document.getElementById('intro-formula-name-input'); // 新增
const introCategoryInput = document.getElementById('intro-category-input'); // 新增
const introCategoryAutocompleteResults = document.getElementById('intro-category-autocomplete-results'); // 新增
const introIngredientsInput = document.getElementById('intro-ingredients-input'); // 新增
const introIndicationsInput = document.getElementById('intro-indications-input'); // 新增
const introEffectsInput = document.getElementById('intro-effects-input'); // 新增
const cancelIntroBtn = document.getElementById('cancel-intro-btn'); // 新增


// Custom Message Box elements
const customMessageBox = document.getElementById('custom-message-box');
const messageBoxTitle = document.getElementById('message-box-title');
const messageBoxContent = document.getElementById('message-box-content');
const messageBoxCloseBtn = document.getElementById('message-box-close-btn');
const messageBoxCancelBtn = document.getElementById('message-box-cancel-btn');

// --- 應用程式狀態數據 (模組作用域) ---
let currentFormula = null; // 當前藥材組成挑戰的方劑物件
let currentCategoryChallenge = null; // 當前藥劑分類挑戰的方劑物件

let mistakeRecords = []; // 儲存錯題記錄 (包含兩種遊戲的錯題)

let formulas = []; // 儲存藥材組成挑戰的方劑列表
let categoryChallenges = []; // 儲存藥劑分類挑戰的方劑列表及分類
let formulaIntroductions = []; // 新增：儲存方劑介紹資料

let allIngredients = []; // 儲存所有藥材名稱，用於藥材組成挑戰的自動完成
let allCategories = []; // 儲存所有分類名稱，用於所有分類相關自動完成和篩選


// --- Firebase 初始化 ---
async function initializeFirebase() {
    // 檢查 Firebase 配置是否已填寫
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase configuration is missing or incomplete. Please update firebaseConfig in script.js.");
        await showCustomMessageBox("錯誤", "Firebase 配置不完整。請編輯 script.js 檔案並填入您的 Firebase 專案資訊。詳情請查看瀏覽器控制台。");
        hideLoadingSpinner();
        // 啟用本地儲存作為備用
        firestoreDb = null;
        firebaseAuth = null;
        firebaseAppInstance = null;
        userId = crypto.randomUUID(); // 生成一個本地使用者 ID
        userInfoElem.textContent = `匿名使用者 ID: ${userId} (無 Firebase 連線)`;
        showManageBtn.classList.add('hidden'); // 無法管理題目
        authReady = true;
        formulas = JSON.parse(localStorage.getItem('localFormulas') || '[]'); // 從 localStorage 載入本地題目
        categoryChallenges = JSON.parse(localStorage.getItem('localCategoryChallenges') || '[]'); // 從 localStorage 載入本地分類題目
        formulaIntroductions = JSON.parse(localStorage.getItem('localFormulaIntroductions') || '[]'); // 新增：從 localStorage 載入本地介紹資料
        loadMistakeRecordsLocal(); // 從 localStorage 載入錯題記錄
        initializeAllCategories(); // 在本地模式下也要初始化分類
        initializeAllIngredients(); // 在本地模式下也要初始化藥材
        showSection(quizSection); // 預設顯示藥材組成挑戰
        displayQuestion();
        renderFormulaCategoriesFilter(); // 渲染分類篩選按鈕
        renderFormulaIntroductions(); // 渲染介紹卡片
        return;
    }

    try {
        firebaseAppInstance = initializeApp(firebaseConfig); // 將 Firebase app 實例賦值給模組級變數
        firebaseAuth = getAuth(firebaseAppInstance); // 使用模組級變數
        firestoreDb = getFirestore(firebaseAppInstance); // 使用模組級變數
        currentAppId = firebaseConfig.projectId; // 將專案 ID 儲存到模組作用域變數

        // 監聽認證狀態變化
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                userId = user.uid;
                userInfoElem.textContent = `使用者 ID: ${userId}`;
                showManageBtn.classList.remove('hidden'); // 登入後顯示管理按鈕
                authReady = true;
                console.log(`Firebase 認證成功。使用者 ID: ${userId}`);
                // 在認證準備就緒後啟動 Firestore 監聽器
                listenToFormulas();
                listenToCategoryChallenges();
                listenToFormulaIntroductions(); // 新增監聽器
                listenToMistakeRecords();
            } else {
                // 如果沒有用戶登錄，嘗試匿名登錄
                try {
                    await signInAnonymously(firebaseAuth); // GitHub Pages 預設使用匿名登入
                    userId = firebaseAuth.currentUser?.uid || crypto.randomUUID(); // Fallback in case uid is null
                    userInfoElem.textContent = `使用者 ID: ${userId} (匿名)`;
                    showManageBtn.classList.remove('hidden'); // 匿名登入也顯示管理按鈕
                    authReady = true;
                    console.log(`Firebase 匿名認證成功。使用者 ID: ${userId}`);
                    listenToFormulas();
                    listenToCategoryChallenges();
                    listenToFormulaIntroductions(); // 新增監聽器
                    listenToMistakeRecords();
                } catch (error) {
                    console.error("Firebase authentication failed:", error);
                    userId = crypto.randomUUID(); // Fallback to a random ID if auth fails
                    userInfoElem.textContent = `匿名使用者 ID: ${userId} (登入失敗)`;
                    showManageBtn.classList.add('hidden'); // 登入失敗則隱藏管理按鈕
                    authReady = true; // 即使失敗也標記為準備就緒，讓應用程式繼續
                    // 如果認證失敗，還是需要嘗試載入題目 (可能沒有權限)
                    listenToFormulas();
                    listenToCategoryChallenges();
                    listenToFormulaIntroductions();
                }
            }
            hideLoadingSpinner();
            // 確保在認證準備就緒後顯示初始頁面
            showSection(quizSection); // 預設顯示藥材組成挑戰
            displayQuestion();
        });
    } catch (error) {
        // 捕獲 initializeApp 失敗的錯誤
        console.error("Firebase App 初始化失敗:", error);
        await showCustomMessageBox("初始化錯誤", `Firebase App 初始化失敗：${error.message || error}。請檢查您的 Firebase 配置是否正確。詳情請查看瀏覽器控制台。`);
        hideLoadingSpinner();
        // 在 Firebase 初始化失敗時，回退到 localStorage
        firestoreDb = null;
        firebaseAuth = null;
        firebaseAppInstance = null;
        userId = crypto.randomUUID();
        userInfoElem.textContent = `匿名使用者 ID: ${userId} (無 Firebase 連線)`;
        showManageBtn.classList.add('hidden');
        authReady = true;
        formulas = JSON.parse(localStorage.getItem('localFormulas') || '[]');
        categoryChallenges = JSON.parse(localStorage.getItem('localCategoryChallenges') || '[]');
        formulaIntroductions = JSON.parse(localStorage.getItem('localFormulaIntroductions') || '[]'); // 新增
        loadMistakeRecordsLocal();
        initializeAllCategories(); // 在本地模式下也要初始化分類
        initializeAllIngredients(); // 在本地模式下也要初始化藥材
        showSection(quizSection);
        displayQuestion();
        renderFormulaCategoriesFilter(); // 渲染分類篩選按鈕
        renderFormulaIntroductions(); // 渲染介紹卡片
    }
}

// --- Firestore 數據監聽 ---
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
        initializeAllIngredients(); // 更新自動完成列表
        initializeAllCategories(); // 因為分類也可能來自藥材組成題目
        if (quizSection.classList.contains('hidden')) {
             // 如果不在藥材組成挑戰頁面，不需要重新顯示問題
        } else {
            displayQuestion(); // 如果在藥材組成挑戰頁面，重新顯示問題
        }
        renderManagedFormulas(formulaSearchInput.value); // 重新渲染管理列表 (帶搜尋條件)
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
        initializeAllCategories(); // 更新自動完成列表 (現在包含所有來源的分類)
        renderFormulaCategoriesFilter(); // 渲染分類篩選按鈕
        if (categoryChallengeSection.classList.contains('hidden')) {
            // 如果不在藥劑分類挑戰頁面，不需要重新顯示問題
        } else {
            displayCategoryQuestion(); // 如果在藥劑分類挑戰頁面，重新顯示問題
        }
        renderManagedCategories(categorySearchInput.value); // 重新渲染分類管理列表 (帶搜尋條件)
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

function listenToFormulaIntroductions() { // 新增監聽器
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
        initializeAllCategories(); // 更新所有分類列表，因為介紹卡片也有分類
        renderFormulaCategoriesFilter(); // 重新渲染分類篩選按鈕
        renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // 重新渲染介紹卡片 (帶篩選和搜尋條件)
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
        console.warn("Firestore 或使用者未準備就緒，無法監聽錯題記錄。回退到 LocalStorage。");
        loadMistakeRecordsLocal(); // 回退到 localStorage
        return;
    }
    // 在這裡列印出要監聽的具體 Firestore 路徑
    console.log(`嘗試監聽錯題記錄 (mistakeRecords) 路徑: artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
    const mistakeRecordsColRef = collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`);
    onSnapshot(mistakeRecordsColRef, (snapshot) => {
        mistakeRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Mistake records loaded from Firestore:", mistakeRecords);
        if (mistakesSection.classList.contains('hidden')) {
            // 如果不在錯題頁面，不需要重新渲染
        } else {
            renderMistakes(); // 重新渲染錯題列表
        }
    }, (error) => {
        console.error("Error listening to mistake records:", error);
        // 如果是權限問題，會顯示特定錯誤碼
        if (error.code === 'permission-denied') {
            showCustomMessageBox("錯誤", "載入錯題記錄失敗：權限不足。請檢查您的 Firestore 安全規則，確保允許讀寫您的私人錯題記錄。");
        } else {
            showCustomMessageBox("錯誤", "無法載入錯題記錄，請檢查網路連線。");
        }
    });
}


// --- 輔助函數：顯示/隱藏區塊 ---
function showSection(sectionToShow) {
    quizSection.classList.add('hidden');
    categoryChallengeSection.classList.add('hidden');
    formulaIntroSection.classList.add('hidden'); // 新增
    mistakesSection.classList.add('hidden');
    manageSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
    quizSection.classList.add('hidden');
    categoryChallengeSection.classList.add('hidden');
    formulaIntroSection.classList.add('hidden'); // 新增
    mistakesSection.classList.add('hidden');
    manageSection.classList.add('hidden');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}

// --- 輔助函數：自定義訊息彈窗 ---
/**
 * 顯示自定義訊息彈窗
 * @param {string} title 彈窗標題
 * @param {string} message 彈窗內容
 * @param {boolean} showCancelBtn 是否顯示取消按鈕 (用於確認框)
 * @returns {Promise<boolean>} 當使用者點擊確認時解析為 true，點擊取消時解析為 false
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

        // 清除之前的事件監聽器，避免重複觸發
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


// --- 輔助函數：數據處理 ---
/**
 * 從 localStorage 載入錯題記錄 (僅當 Firestore 未啟用時作為備用)
 */
function loadMistakeRecordsLocal() {
    try {
        const records = localStorage.getItem('mistakeRecords');
        mistakeRecords = records ? JSON.parse(records) : [];
    } catch (e) {
        console.error("從 localStorage 載入錯題記錄失敗:", e);
        mistakeRecords = [];
    }
}

/**
 * 將錯題記錄儲存到 localStorage (僅當 Firestore 未啟用時作為備用)
 */
function saveMistakeRecordsLocal() {
    try {
        localStorage.setItem('mistakeRecords', JSON.stringify(mistakeRecords));
    } catch (e) {
        console.error("將錯題記錄儲存到 localStorage 失敗:", e);
        showCustomMessageBox("錯誤", "無法儲存錯題記錄，請檢查瀏覽器儲存設定。");
    }
}

/**
 * 標準化藥材名稱，用於比較
 * 移除空白字符，轉換為小寫，並處理常見的同義字/簡寫
 * @param {string} ingredient 藥材名稱
 * @returns {string} 標準化後的藥材名稱
*/
function normalizeIngredient(ingredient) {
    return ingredient.trim().toLowerCase()
        .replace(/炙?甘草/g, '炙甘草') // 炙甘草和甘草統一
        .replace(/乾?地黃/g, '乾地黃') // 乾地黃和地黃統一 (假設此處指熟地黃)
        .replace(/熟地/g, '熟地黃') // 熟地和熟地黃統一
        .replace(/人蔘/g, '人參'); // 人蔘和人參統一
    // 可以根據需要添加更多同義字處理
}

/**
 * 標準化分類名稱，用於比較
 * 移除空白字符，轉換為小寫
 * @param {string} category 分類名稱
 * @returns {string} 標準化後的分類名稱
 */
function normalizeCategory(category) {
    return category.trim().toLowerCase();
}

/**
 * 解析使用者輸入的藥材列表
 * @param {string} input 使用者輸入的字串
 * @returns {string[]} 標準化後的藥材名稱陣列
 */
function parseUserAnswer(input) {
    return input.split(/[,，\s\n]+/) // 以逗號、全形逗號、空白、換行符分隔
                .filter(item => item.trim() !== '') // 移除空字串
                .map(normalizeIngredient); // 標準化每個藥材名稱
}

/**
 * 初始化所有藥材名稱用於自動完成 (藥材組成挑戰)
 */
function initializeAllIngredients() {
    const uniqueIngredients = new Set();
    formulas.forEach(formula => {
        if (formula.ingredients && Array.isArray(formula.ingredients)) {
            formula.ingredients.forEach(ing => {
                uniqueIngredients.add(ing); // 這裡使用原始名稱，以便自動完成顯示正確名稱
            });
        }
    });
    allIngredients = Array.from(uniqueIngredients).sort();
}

/**
 * 初始化所有分類名稱用於自動完成 (來自所有來源的分類)
 */
function initializeAllCategories() {
    const uniqueCategories = new Set();
    categoryChallenges.forEach(challenge => {
        if (challenge.category) {
            uniqueCategories.add(challenge.category);
        }
    });
    formulaIntroductions.forEach(intro => { // 從方劑介紹中獲取分類
        if (intro.category) {
            uniqueCategories.add(intro.category);
        }
    });
    allCategories = Array.from(uniqueCategories).sort();
}


// --- 核心藥材組成問答邏輯 ---
/**
 * 顯示一道新的藥材組成問題
 */
function displayQuestion() {
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
        userAnswerInput.disabled = false;
        submitAnswerBtn.classList.remove('hidden');
        showCorrectAnswerBtn.classList.remove('hidden');
    }

    // 隨機選擇一個方劑
    const randomIndex = Math.floor(Math.random() * formulas.length);
    currentFormula = formulas[randomIndex];

    // 更新 DOM 元素顯示題目
    formulaNameElem.textContent = currentFormula.name;
    formulaHintElem.textContent = currentFormula.hint ? `提示：${currentFormula.hint}` : '';
    userAnswerInput.value = ''; // 清空使用者輸入
    feedbackMessageElem.classList.add('hidden'); // 隱藏回饋訊息
    feedbackMessageElem.textContent = '';
    nextQuestionBtn.classList.add('hidden'); // 隱藏 "下一題" 按鈕
    userAnswerInput.focus(); // 輸入框自動取得焦點
}

/**
 * 檢查使用者藥材組成答案
 */
async function checkAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前藥材組成題目可供檢查。");
        return;
    }

    const userParsed = parseUserAnswer(userAnswerInput.value);
    // 確保 correctParsed 是一個陣列
    const correctParsed = Array.isArray(currentFormula.ingredients) ? currentFormula.ingredients.map(normalizeIngredient) : [];

    // 判斷是否完全匹配 (不考慮順序)
    const isCorrect = userParsed.length === correctParsed.length &&
                      userParsed.every(ing => correctParsed.includes(ing)) &&
                      correctParsed.every(ing => userParsed.includes(ing));

    feedbackMessageElem.classList.remove('hidden');
    if (isCorrect) {
        feedbackMessageElem.textContent = "恭喜，回答正確！";
        feedbackMessageElem.className = 'text-center text-lg font-medium text-green-600';
        await showCustomMessageBox("正確", "恭喜，回答正確！您對這道方劑瞭若指掌。");
    } else {
        feedbackMessageElem.textContent = `很抱歉，答案不完全正確。\n正確答案是：${(currentFormula.ingredients || []).join('、')}`;
        feedbackMessageElem.className = 'text-center text-lg font-medium text-red-600 whitespace-pre-line';

        // 將錯誤的題目加入錯題記錄
        await addMistake(currentFormula.name, userAnswerInput.value, (currentFormula.ingredients || []).join('、'), '藥材組成');
        await showCustomMessageBox("錯誤", `很抱歉，答案不完全正確。\n正確答案是：${(currentFormula.ingredients || []).join('、')}\n\n這題已加入錯題記錄。`);
    }

    // 鎖定輸入框和提交按鈕，顯示下一題按鈕
    userAnswerInput.disabled = true;
    submitAnswerBtn.classList.add('hidden');
    showCorrectAnswerBtn.classList.add('hidden'); // 提交後也隱藏顯示答案按鈕
    nextQuestionBtn.classList.remove('hidden');
}

/**
 * 顯示正確藥材組成答案 (使用者主動點擊)
 */
async function showCorrectAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前藥材組成題目可供顯示答案。");
        return;
    }

    // 顯示正確答案並加入錯題記錄
    feedbackMessageElem.classList.remove('hidden');
    feedbackMessageElem.textContent = `正確答案是：${(currentFormula.ingredients || []).join('、')}`;
    feedbackMessageElem.className = 'text-center text-lg font-medium text-yellow-600';

    // 即使使用者點擊顯示答案，也視為未答對，加入錯題記錄
    await addMistake(currentFormula.name, userAnswerInput.value, (currentFormula.ingredients || []).join('、'), '藥材組成');

    // 鎖定輸入框和提交按鈕，顯示下一題按鈕
    userAnswerInput.disabled = true;
    submitAnswerBtn.classList.add('hidden');
    showCorrectAnswerBtn.classList.add('hidden');
    nextQuestionBtn.classList.remove('hidden');
    await showCustomMessageBox("答案揭曉", `這道題的正確答案是：${(currentFormula.ingredients || []).join('、')}\n\n這題已加入錯題記錄。`);
}

/**
 * 將錯誤的題目加入錯題記錄列表 (Firestore 或 LocalStorage)
 * @param {string} formulaName 方劑名稱
 * @param {string} userAnswer 使用者的回答
 * @param {string} correctAnswer 正確答案
 * @param {string} challengeType 挑戰類型 (e.g., '藥材組成', '藥劑分類')
 */
async function addMistake(formulaName, userAnswer, correctAnswer, challengeType) {
    const newRecord = {
        formulaName: formulaName,
        userAnswer: userAnswer || "未作答",
        correctAnswer: correctAnswer,
        challengeType: challengeType,
        timestamp: new Date().toISOString()
    };

    if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
        // 使用 Firestore 儲存
        try {
            await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`), newRecord);
            console.log("Mistake added to Firestore.");
        } catch (e) {
            console.error("將錯題加入 Firestore 失敗:", e);
            showCustomMessageBox("錯誤", "無法儲存錯題記錄到雲端。");
        }
    } else {
        // 回退到 localStorage
        // 在本地模式下，由於沒有 Firestore ID，我們需要檢查是否已經存在完全相同的記錄以避免重複
        const exists = mistakeRecords.some(record =>
            record.formulaName === formulaName &&
            record.userAnswer === (userAnswer || "未作答") &&
            record.correctAnswer === correctAnswer &&
            record.challengeType === challengeType
        );
        if (!exists) {
            // 為本地記錄生成一個臨時 ID，確保更唯一
            mistakeRecords.push({ ...newRecord, id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            saveMistakeRecordsLocal();
            console.log("Mistake added to LocalStorage.");
        }
    }
}


// --- 核心藥劑分類大挑戰邏輯 ---
/**
 * 顯示一道新的藥劑分類問題
 */
function displayCategoryQuestion() {
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
        userCategoryAnswerInput.disabled = false;
        submitCategoryAnswerBtn.classList.remove('hidden');
        showCorrectCategoryAnswerBtn.classList.remove('hidden');
    }

    const randomIndex = Math.floor(Math.random() * categoryChallenges.length);
    currentCategoryChallenge = categoryChallenges[randomIndex];

    categoryFormulaNameElem.textContent = currentCategoryChallenge.name;
    categoryChallengeHintElem.textContent = currentCategoryChallenge.hint ? `提示：${currentCategoryChallenge.hint}` : '';
    userCategoryAnswerInput.value = '';
    categoryFeedbackMessageElem.classList.add('hidden');
    categoryFeedbackMessageElem.textContent = '';
    nextCategoryQuestionBtn.classList.add('hidden');
    userCategoryAnswerInput.focus();
}

/**
 * 檢查使用者藥劑分類答案
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
    } else {
        categoryFeedbackMessageElem.textContent = `很抱歉，答案不完全正確。\n正確答案是：${currentCategoryChallenge.category}`;
        categoryFeedbackMessageElem.className = 'text-center text-lg font-medium text-red-600 whitespace-pre-line';

        await addMistake(currentCategoryChallenge.name, userCategoryAnswerInput.value, currentCategoryChallenge.category, '藥劑分類');
        await showCustomMessageBox("錯誤", `很抱歉，答案不完全正確。\n正確答案是：${currentCategoryChallenge.category}\n\n這題已加入錯題記錄。`);
    }

    userCategoryAnswerInput.disabled = true;
    submitCategoryAnswerBtn.classList.add('hidden');
    showCorrectCategoryAnswerBtn.classList.add('hidden');
    nextCategoryQuestionBtn.classList.remove('hidden');
}

/**
 * 顯示正確藥劑分類答案 (使用者主動點擊)
 */
async function showCorrectCategoryAnswer() {
    if (!currentCategoryChallenge) {
        showCustomMessageBox("錯誤", "沒有當前藥劑分類題目可供顯示答案。");
        return;
    }

    categoryFeedbackMessageElem.classList.remove('hidden');
    categoryFeedbackMessageElem.textContent = `正確答案是：${currentCategoryChallenge.category}`;
    categoryFeedbackMessageElem.className = 'text-center text-lg font-medium text-yellow-600';

    await addMistake(currentCategoryChallenge.name, userCategoryAnswerInput.value, currentCategoryChallenge.category, '藥劑分類');

    userCategoryAnswerInput.disabled = true;
    submitCategoryAnswerBtn.classList.add('hidden');
    showCorrectCategoryAnswerBtn.classList.add('hidden');
    nextCategoryQuestionBtn.classList.remove('hidden');
    await showCustomMessageBox("答案揭曉", `這道題的正確答案是：${currentCategoryChallenge.category}\n\n這題已加入錯題記錄。`);
}


// --- 錯題記錄頁面邏輯 ---
/**
 * 渲染錯題記錄列表
 */
function renderMistakes() {
    mistakesListElem.innerHTML = ''; // 清空現有列表

    if (mistakeRecords.length === 0) {
        noMistakesMessageElem.classList.remove('hidden');
        clearMistakesBtn.classList.add('hidden');
        return;
    } else {
        noMistakesMessageElem.classList.add('hidden');
        clearMistakesBtn.classList.remove('hidden');
    }

    mistakeRecords.forEach((record) => {
        const mistakeItem = document.createElement('div');
        mistakeItem.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm relative';
        mistakeItem.innerHTML = `
            <h3 class="text-xl font-semibold text-blue-800 mb-2 break-words">
                ${record.formulaName} 
                <span class="text-sm font-normal text-gray-500">(${record.challengeType})</span>
            </h3>
            <p class="text-gray-700 mb-1 break-words"><span class="font-medium">您的回答：</span> ${record.userAnswer}</p>
            <p class="text-gray-700 break-words"><span class="font-medium">正確答案：</span> ${record.correctAnswer}</p>
            <button data-id="${record.id}" class="remove-mistake-btn absolute top-3 right-3 text-red-500 hover:text-red-700 text-2xl font-bold leading-none" title="從記錄中移除">
                &times;
            </button>
        `;
        mistakesListElem.appendChild(mistakeItem);
    });

    // 為每個移除按鈕添加事件監聽器
    document.querySelectorAll('.remove-mistake-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const recordIdToRemove = event.target.dataset.id;
            removeMistake(recordIdToRemove);
        });
    });
}

/**
 * 移除單條錯題記錄 (Firestore 或 LocalStorage)
 * @param {string} recordId 要移除的記錄 ID (Firestore ID 或在 LocalStorage 中重新匹配)
 */
async function removeMistake(recordId) {
    const confirmRemoval = await showCustomMessageBox("確認移除", "您確定要移除這條錯題記錄嗎？", true);
    if (confirmRemoval) {
        if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
            // 使用 Firestore 移除
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`, recordId));
                showCustomMessageBox("完成", "錯題記錄已從雲端移除。");
            } catch (e) {
                console.error("從 Firestore 移除錯題失敗:", e);
                showCustomMessageBox("錯誤", "無法從雲端移除錯題記錄。");
            }
        } else {
            // 回退到 localStorage 移除
            const initialLength = mistakeRecords.length;
            mistakeRecords = mistakeRecords.filter(record => record.id !== recordId);
            if (mistakeRecords.length < initialLength) {
                saveMistakeRecordsLocal();
                showCustomMessageBox("完成", "錯題記錄已從本地移除。");
                renderMistakes(); // 重新渲染列表
            }
        }
    }
}

/**
 * 清空所有錯題記錄 (Firestore 或 LocalStorage)
 */
async function clearAllMistakes() {
    const confirmClear = await showCustomMessageBox("確認清空", "您確定要清空所有錯題記錄嗎？此操作不可恢復。", true);
    if (confirmClear) {
        if (firestoreDb && userId !== 'anonymous' && authReady && currentAppId) {
            // 使用 Firestore 清空 (迭代刪除)
            try {
                for (const record of mistakeRecords) {
                    await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/users/${userId}/mistakeRecords`, record.id));
                }
                showCustomMessageBox("完成", "所有錯題記錄已從雲端清空。");
            } catch (e) {
                console.error("清空 Firestore 錯題失敗:", e);
                showCustomMessageBox("錯誤", "無法清空雲端錯題記錄。");
            }
        } else {
            // 回退到 localStorage
            mistakeRecords = [];
            saveMistakeRecordsLocal();
            showCustomMessageBox("完成", "所有錯題記錄已從本地清空。");
            renderMistakes(); // 重新渲染列表
        }
    }
}

// --- 藥材組成題目管理邏輯 ---
/**
 * 渲染藥材組成題目管理列表，支援搜尋功能
 * @param {string} [searchText=''] 搜尋關鍵字，如果為空則顯示所有題目
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

    // 為編輯和刪除按鈕添加事件監聽器
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
 * 開啟新增/編輯藥材組成題目彈窗
 * @param {string|null} formulaId 要編輯的方劑 ID，若為 null 則為新增模式
 */
function openFormulaModal(formulaId = null) {
    formulaForm.reset(); // 重置表單
    formulaModal.dataset.editId = formulaId; // 儲存當前編輯的 ID

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
        formulaModal.dataset.editId = ''; // 確保新增模式下沒有編輯 ID
    }
    formulaModal.classList.remove('hidden');
}

/**
 * 關閉新增/編輯藥材組成題目彈窗
 */
function closeFormulaModal() {
    formulaModal.classList.add('hidden');
    formulaModal.dataset.editId = ''; // 清除編輯 ID
}

/**
 * 處理新增/編輯藥材組成題目的表單提交
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

    const formulaData = { name, ingredients, hint };
    const editId = formulaModal.dataset.editId; // 從 data-edit-id 獲取編輯 ID

    if (firestoreDb && authReady && currentAppId) {
        try {
            if (editId) {
                // 編輯現有方劑
                await setDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`, editId), formulaData);
                await showCustomMessageBox("成功", "藥材組成題目更新成功！");
            } else {
                // 新增方劑
                await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`), formulaData);
                await showCustomMessageBox("成功", "新藥材組成題目新增成功！");
            }
            closeFormulaModal();
        } catch (e) {
            console.error("儲存藥材組成題目失敗:", e);
            await showCustomMessageBox("錯誤", "儲存藥材組成題目失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // 如果沒有 Firebase 或認證未準備就緒，回退到 localStorage 處理
        if (editId) {
            // 編輯本地現有方劑
            const index = formulas.findIndex(f => f.id === editId);
            if (index !== -1) {
                formulas[index] = { ...formulaData, id: editId };
                await showCustomMessageBox("成功", "藥材組成題目已在本地更新！");
            } else {
                 await showCustomMessageBox("錯誤", "本地編輯失敗：找不到要編輯的藥材組成題目。");
            }
        } else {
            // 新增本地方劑，生成更唯一的 ID
            formulas.push({ ...formulaData, id: `local-formula-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            await showCustomMessageBox("成功", "新藥材組成題目已在本地新增！");
        }
        localStorage.setItem('localFormulas', JSON.stringify(formulas)); // 儲存到本地
        renderManagedFormulas(formulaSearchInput.value); // 重新渲染，包含任何搜尋過濾
        closeFormulaModal();
    }
});

/**
 * 啟動編輯藥材組成題目流程
 * @param {string} formulaId 要編輯的方劑 ID
 */
function editFormula(formulaId) {
    openFormulaModal(formulaId);
}

/**
 * 啟動刪除藥材組成題目流程
 * @param {string} formulaId 要刪除的方劑 ID
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
                console.error("刪除藥材組成題目失敗:", e);
                await showCustomMessageBox("錯誤", "刪除藥材組成題目失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // 回退到 localStorage 刪除
            const initialLength = formulas.length;
            formulas = formulas.filter(f => f.id !== formulaId);
            if (formulas.length < initialLength) {
                localStorage.setItem('localFormulas', JSON.stringify(formulas));
                await showCustomMessageBox("成功", "藥材組成題目已從本地刪除！");
                renderManagedFormulas(formulaSearchInput.value); // 重新渲染，包含任何搜尋過濾
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的藥材組成題目。");
            }
        }
    }
}


// --- 藥劑分類題目管理邏輯 ---
/**
 * 渲染藥劑分類題目管理列表，支援搜尋功能
 * @param {string} [searchText=''] 搜尋關鍵字，如果為空則顯示所有題目
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
 * 開啟新增/編輯藥劑分類題目彈窗
 * @param {string|null} challengeId 要編輯的方劑分類 ID，若為 null 則為新增模式
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
 * 關閉新增/編輯藥劑分類題目彈窗
 */
function closeCategoryModal() {
    categoryModal.classList.add('hidden');
    categoryModal.dataset.editId = '';
}

/**
 * 處理新增/編輯藥劑分類題目的表單提交
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

    const challengeData = { name, category, hint };
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
            console.error("儲存藥劑分類題目失敗:", e);
            await showCustomMessageBox("錯誤", "儲存藥劑分類題目失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // 回退到 localStorage 處理
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
        renderManagedCategories(categorySearchInput.value); // 重新渲染，包含任何搜尋過濾
        closeCategoryModal();
    }
});

/**
 * 啟動刪除藥劑分類題目流程
 * @param {string} challengeId 要刪除的方劑分類 ID
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
                console.error("刪除藥劑分類題目失敗:", e);
                await showCustomMessageBox("錯誤", "刪除藥劑分類題目失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // 回退到 localStorage 刪除
            const initialLength = categoryChallenges.length;
            categoryChallenges = categoryChallenges.filter(c => c.id !== challengeId);
            if (categoryChallenges.length < initialLength) {
                localStorage.setItem('localCategoryChallenges', JSON.stringify(categoryChallenges));
                await showCustomMessageBox("成功", "藥劑分類題目已從本地刪除！");
                renderManagedCategories(categorySearchInput.value); // 重新渲染，包含任何搜尋過濾
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的藥劑分類題目。");
            }
        }
    }
}


// --- 方劑介紹區塊邏輯 (新增) ---
/**
 * 渲染方劑介紹卡片列表，支援分類篩選和搜尋功能
 * @param {string} categoryFilter 當前篩選的分類，'全部'表示不篩選
 * @param {string} searchText 搜尋關鍵字，用於方劑名稱篩選
 */
function renderFormulaIntroductions(categoryFilter = '全部', searchText = '') {
    formulaIntroductionsList.innerHTML = '';
    let filteredIntros = formulaIntroductions;

    // 1. 根據分類篩選
    if (categoryFilter !== '全部') {
        filteredIntros = filteredIntros.filter(intro => normalizeCategory(intro.category) === normalizeCategory(categoryFilter));
    }

    // 2. 根據搜尋文字篩選
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
            <p class="text-gray-800 break-words"><strong>效果：</strong> ${intro.effects || '無'}</p>
            <div class="flex space-x-2 mt-4 justify-end">
                <button data-id="${intro.id}" class="edit-intro-btn bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-300">
                    編輯
                </button>
                <button data-id="${intro.id}" class="delete-intro-btn bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-300">
                    刪除
                </button>
            </div>
        `;
        formulaIntroductionsList.appendChild(introCard);
    });

    document.querySelectorAll('#formula-introductions-list .edit-intro-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const introId = event.target.dataset.id;
            openFormulaIntroModal(introId);
        });
    });

    document.querySelectorAll('#formula-introductions-list .delete-intro-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const introId = event.target.dataset.id;
            deleteFormulaIntro(introId);
        });
    });
}

/**
 * 渲染方劑介紹區的分類篩選按鈕
 */
function renderFormulaCategoriesFilter() {
    categoryFilterContainer.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.className = `category-filter-btn px-4 py-2 rounded-lg font-semibold transition duration-300 active:scale-95 mb-2 md:mb-0 ${currentFormulaIntroCategoryFilter === '全部' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
    allButton.textContent = '全部';
    allButton.dataset.category = '全部';
    categoryFilterContainer.appendChild(allButton);

    allCategories.forEach(category => {
        if (category.trim() === '') return; // 避免空類別按鈕
        const button = document.createElement('button');
        button.className = `category-filter-btn px-4 py-2 rounded-lg font-semibold transition duration-300 active:scale-95 mb-2 md:mb-0 ${currentFormulaIntroCategoryFilter === category ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
        button.textContent = category;
        button.dataset.category = category;
        categoryFilterContainer.appendChild(button);
    });

    // 為所有分類篩選按鈕添加事件監聽器
    document.querySelectorAll('.category-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const selectedCategory = event.target.dataset.category;
            currentFormulaIntroCategoryFilter = selectedCategory; // 更新選中的分類
            renderFormulaIntroductions(selectedCategory, introSearchInput.value); // 重新渲染卡片
            // 更新按鈕樣式
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
 * 開啟新增/編輯方劑介紹彈窗
 * @param {string|null} introId 要編輯的介紹卡片 ID，若為 null 則為新增模式
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
 * 關閉新增/編輯方劑介紹彈窗
 */
function closeFormulaIntroModal() {
    formulaIntroModal.classList.add('hidden');
    formulaIntroModal.dataset.editId = '';
}

/**
 * 處理新增/編輯方劑介紹的表單提交
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
            console.error("儲存方劑介紹失敗:", e);
            await showCustomMessageBox("錯誤", "儲存方劑介紹失敗，請檢查網路連線或 Firestore 規則。");
        }
    } else {
        // 回退到 localStorage 處理
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
        renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value);
        closeFormulaIntroModal();
    }
});

/**
 * 啟動刪除方劑介紹流程
 * @param {string} introId 要刪除的介紹卡片 ID
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
                console.error("刪除方劑介紹失敗:", e);
                await showCustomMessageBox("錯誤", "刪除方劑介紹失敗，請檢查網路連線或 Firestore 規則。");
            }
        } else {
            // 回退到 localStorage 刪除
            const initialLength = formulaIntroductions.length;
            formulaIntroductions = formulaIntroductions.filter(i => i.id !== introId);
            if (formulaIntroductions.length < initialLength) {
                localStorage.setItem('localFormulaIntroductions', JSON.stringify(formulaIntroductions));
                await showCustomMessageBox("成功", "方劑介紹已從本地刪除！");
                renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value);
            } else {
                await showCustomMessageBox("錯誤", "本地刪除失敗：找不到要刪除的方劑介紹。");
            }
        }
    }
}


// --- 自動完成功能 ---
/**
 * 根據輸入顯示自動完成建議 (藥材組成挑戰)
 * @param {string} input 用戶在輸入框中鍵入的文字
 */
function showAutocompleteSuggestions(input) {
    autocompleteResults.innerHTML = '';
    const typedText = input.toLowerCase().trim();
    if (typedText.length === 0) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    // 找到最後一個未完成的藥材輸入
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
        suggestions.slice(0, 10).forEach(suggestion => { // 最多顯示10個建議
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'p-2 cursor-pointer hover:bg-blue-100 rounded-lg text-gray-800';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                const existingPart = input.substring(0, lastCommaIndex + 1);
                userAnswerInput.value = existingPart + suggestion + ', ';
                autocompleteResults.classList.add('hidden');
                userAnswerInput.focus(); // 讓輸入框保持焦點
            });
            autocompleteResults.appendChild(suggestionItem);
        });
        autocompleteResults.classList.remove('hidden');
    } else {
        autocompleteResults.classList.add('hidden');
    }
}

/**
 * 根據輸入顯示自動完成建議 (藥劑分類大挑戰和方劑介紹新增/編輯)
 * @param {HTMLInputElement} inputElement 綁定自動完成的輸入框元素
 * @param {HTMLElement} resultsContainer 自動完成結果的容器元素
 * @param {string} input 用戶在輸入框中鍵入的文字
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


// --- 事件監聽器 ---
document.addEventListener('DOMContentLoaded', () => {
    showLoadingSpinner();
    initializeFirebase(); // 啟動 Firebase 初始化和認證
});

showQuizBtn.addEventListener('click', () => {
    showSection(quizSection);
    displayQuestion(); // 切換到藥材組成挑戰頁面時重新載入問題
});

showCategoryChallengeBtn.addEventListener('click', () => {
    showSection(categoryChallengeSection);
    displayCategoryQuestion(); // 切換到藥劑分類挑戰頁面時重新載入問題
});

showFormulaIntroBtn.addEventListener('click', () => { // 新增事件監聽
    showSection(formulaIntroSection);
    renderFormulaCategoriesFilter(); // 渲染篩選按鈕
    renderFormulaIntroductions(currentFormulaIntroCategoryFilter, introSearchInput.value); // 渲染介紹卡片
});

showMistakesBtn.addEventListener('click', () => {
    showSection(mistakesSection);
    renderMistakes(); // 切換到錯題頁面時渲染錯題
});

showManageBtn.addEventListener('click', () => {
    showSection(manageSection);
    // 進入管理頁面時，清空搜尋框並重新渲染所有題目
    formulaSearchInput.value = ''; // 清空搜尋框
    categorySearchInput.value = ''; // 清空搜尋框
    renderManagedFormulas(''); // 載入藥材組成題目管理列表 (不帶搜尋條件)
    renderManagedCategories(''); // 載入藥劑分類題目管理列表 (不帶搜尋條件)
});

// 藥材組成挑戰按鈕
submitAnswerBtn.addEventListener('click', checkAnswer);
showCorrectAnswerBtn.addEventListener('click', showCorrectAnswer);
nextQuestionBtn.addEventListener('click', displayQuestion);

// 藥劑分類大挑戰按鈕
submitCategoryAnswerBtn.addEventListener('click', checkCategoryAnswer);
showCorrectCategoryAnswerBtn.addEventListener('click', showCorrectCategoryAnswer);
nextCategoryQuestionBtn.addEventListener('click', displayCategoryQuestion);

// 錯題記錄按鈕
clearMistakesBtn.addEventListener('click', clearAllMistakes);

// 題目管理新增按鈕
addFormulaBtn.addEventListener('click', () => openFormulaModal()); // 開啟新增藥材組成題目模式
addCategoryChallengeBtn.addEventListener('click', () => openCategoryModal()); // 開啟新增藥劑分類題目模式
addFormulaIntroBtnTop.addEventListener('click', () => openFormulaIntroModal()); // 新增：方劑介紹區的「新增」按鈕

// 彈窗的取消按鈕
cancelFormulaBtn.addEventListener('click', closeFormulaModal);
cancelCategoryBtn.addEventListener('click', closeCategoryModal);
cancelIntroBtn.addEventListener('click', closeFormulaIntroModal); // 新增

// 輸入框監聽器，用於自動完成
userAnswerInput.addEventListener('input', (event) => {
    showAutocompleteSuggestions(event.target.value);
});
userCategoryAnswerInput.addEventListener('input', (event) => {
    showCategoryAutocompleteSuggestions(userCategoryAnswerInput, categoryAutocompleteResults, event.target.value);
});
introCategoryInput.addEventListener('input', (event) => { // 新增方劑介紹分類輸入框的自動完成
    showCategoryAutocompleteSuggestions(introCategoryInput, introCategoryAutocompleteResults, event.target.value);
});


// 題目管理搜尋框監聽器 (修復：傳遞搜尋字串)
formulaSearchInput.addEventListener('input', (event) => {
    renderManagedFormulas(event.target.value);
});
categorySearchInput.addEventListener('input', (event) => {
    renderManagedCategories(event.target.value);
});
introSearchInput.addEventListener('input', (event) => { // 新增方劑介紹搜尋框
    renderFormulaIntroductions(currentFormulaIntroCategoryFilter, event.target.value);
});


// 點擊輸入框外隱藏自動完成列表和模態框
document.addEventListener('click', (event) => {
    // 隱藏藥材組成挑戰的自動完成結果
    if (!userAnswerInput.contains(event.target) && !autocompleteResults.contains(event.target)) {
        autocompleteResults.classList.add('hidden');
    }
    // 隱藏藥劑分類挑戰的自動完成結果
    if (!userCategoryAnswerInput.contains(event.target) && !categoryAutocompleteResults.contains(event.target)) {
        categoryAutocompleteResults.classList.add('hidden');
    }
    // 隱藏方劑介紹分類輸入框的自動完成結果
    if (!introCategoryInput.contains(event.target) && !introCategoryAutocompleteResults.contains(event.target)) {
        introCategoryAutocompleteResults.classList.add('hidden');
    }

    // 判斷是否點擊到模態框內容或打開模態框的按鈕
    const isClickInsideFormulaModal = formulaModal.contains(event.target) || event.target === addFormulaBtn;
    const isClickInsideCategoryModal = categoryModal.contains(event.target) || event.target === addCategoryChallengeBtn;
    const isClickInsideFormulaIntroModal = formulaIntroModal.contains(event.target) || event.target === addFormulaIntroBtnTop;

    // 如果點擊不在模態框內部，也不在打開模態框的按鈕上，則關閉模態框。
    // 注意：這裡只處理點擊空白處關閉，點擊取消按鈕依然需要綁定 closeXxxModal。
    // 為了避免過度干預使用者操作，預設不自動關閉，讓使用者必須點擊取消或儲存。
    // 如果您需要點擊外部自動關閉，可以解除以下註釋，但請測試使用者體驗。
    /*
    if (!isClickInsideFormulaModal && !formulaModal.classList.contains('hidden')) {
        closeFormulaModal();
    }
    if (!isClickInsideCategoryModal && !categoryModal.classList.contains('hidden')) {
        closeCategoryModal();
    }
    if (!isClickInsideFormulaIntroModal && !formulaIntroModal.classList.contains('hidden')) {
        closeFormulaIntroModal();
    }
    */
});

// 按下 Esc 鍵也隱藏自動完成列表和模態框 (模態框的關閉邏輯與點擊外部類似，建議手動關閉)
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        autocompleteResults.classList.add('hidden');
        categoryAutocompleteResults.classList.add('hidden');
        introCategoryAutocompleteResults.classList.add('hidden');
        // 您可以選擇在這裡也加入模態框的關閉邏輯，例如：
        // if (!formulaModal.classList.contains('hidden')) closeFormulaModal();
        // if (!categoryModal.classList.contains('hidden')) closeCategoryModal();
        // if (!formulaIntroModal.classList.contains('hidden')) closeFormulaIntroModal();
    }
});


// 處理 Enter 鍵提交答案，而不是換行 (藥材組成挑戰)
userAnswerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter 仍可換行
        event.preventDefault(); // 阻止預設換行行為
        if (!nextQuestionBtn.classList.contains('hidden')) { // 如果已經顯示下一題按鈕，則切換到下一題
            nextQuestionBtn.click();
        } else if (!submitAnswerBtn.classList.contains('hidden')) { // 否則提交答案
            submitAnswerBtn.click();
        }
    }
});

// 處理 Enter 鍵提交答案，而不是換行 (藥劑分類大挑戰)
userCategoryAnswerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter 仍可換行
        event.preventDefault(); // 阻止預設換行行為
        if (!nextCategoryQuestionBtn.classList.contains('hidden')) {
            nextCategoryQuestionBtn.click();
        } else if (!submitCategoryAnswerBtn.classList.contains('hidden')) {
            submitCategoryAnswerBtn.click();
        }
    }
});
