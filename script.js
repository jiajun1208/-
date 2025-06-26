// 導入 Firebase 模組 (使用完整的 CDN URL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, updateDoc, deleteDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =====================================================================
// 請在此處貼上您的 Firebase 專案配置！
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
let firebaseAppInstance = null; // 新增：用於儲存 Firebase app 實例
let currentAppId = null; // 從 firebaseConfig.projectId 獲取

// 應用程式狀態變數 (模組作用域)
let userId = 'anonymous'; // 當前使用者 ID
let authReady = false; // 標誌，表示 Firebase 認證是否準備就緒

// --- DOM 元素獲取 (保持不變) ---
const userInfoElem = document.getElementById('user-info');
const showQuizBtn = document.getElementById('show-quiz-btn');
const showMistakesBtn = document.getElementById('show-mistakes-btn');
const showManageBtn = document.getElementById('show-manage-btn');
const quizSection = document.getElementById('quiz-section');
const mistakesSection = document.getElementById('mistakes-section');
const manageSection = document.getElementById('manage-section');
const loadingSpinner = document.getElementById('loading-spinner');

// Quiz Section elements
const formulaNameElem = document.getElementById('formula-name');
const formulaHintElem = document.getElementById('formula-hint');
const userAnswerInput = document.getElementById('user-answer');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const showCorrectAnswerBtn = document.getElementById('show-correct-answer-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const feedbackMessageElem = document.getElementById('feedback-message');
const autocompleteResults = document.getElementById('autocomplete-results');
const noFormulasMessage = document.getElementById('no-formulas-message');

// Mistakes Section elements
const mistakesListElem = document.getElementById('mistakes-list');
const clearMistakesBtn = document.getElementById('clear-mistakes-btn');
const noMistakesMessageElem = document.getElementById('no-mistakes-message');

// Manage Section elements
const addFormulaBtn = document.getElementById('add-formula-btn');
const formulaListElem = document.getElementById('formula-list');
const noManagedFormulasMessage = document.getElementById('no-managed-formulas-message');

// Formula Modal elements
const formulaModal = document.getElementById('formula-modal');
const modalTitle = document.getElementById('modal-title');
const formulaForm = document.getElementById('formula-form');
const formulaNameInput = document.getElementById('formula-name-input');
const formulaIngredientsInput = document.getElementById('formula-ingredients-input');
const formulaHintInput = document.getElementById('formula-hint-input');
const cancelFormulaBtn = document.getElementById('cancel-formula-btn');

// Custom Message Box elements
const customMessageBox = document.getElementById('custom-message-box');
const messageBoxTitle = document.getElementById('message-box-title');
const messageBoxContent = document.getElementById('message-box-content');
const messageBoxCloseBtn = document.getElementById('message-box-close-btn');
const messageBoxCancelBtn = document.getElementById('message-box-cancel-btn');

// --- 應用程式狀態數據 (模組作用域) ---
let currentFormula = null; // 當前問題的方劑物件
let mistakeRecords = []; // 儲存錯題記錄
let formulas = []; // 儲存從 Firestore 獲取的方劑列表
let allIngredients = []; // 儲存所有藥材名稱，用於自動完成


// --- Firebase 初始化 ---
async function initializeFirebase() {
    // 檢查 Firebase 配置是否已填寫
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error("Firebase configuration is missing or incomplete. Please update firebaseConfig.");
        await showCustomMessageBox("錯誤", "Firebase 配置不完整。請編輯 script.js 檔案並填入您的 Firebase 專案資訊。");
        hideLoadingSpinner();
        // 啟用本地儲存作為備用
        firestoreDb = null;
        firebaseAuth = null;
        firebaseAppInstance = null; // 確保這個變數在錯誤時也為 null
        userId = crypto.randomUUID(); // 生成一個本地使用者 ID
        userInfoElem.textContent = `匿名使用者 ID: ${userId} (無 Firebase 連線)`;
        showManageBtn.classList.add('hidden'); // 無法管理題目
        authReady = true;
        formulas = JSON.parse(localStorage.getItem('localFormulas') || '[]'); // 從 localStorage 載入本地題目
        loadMistakeRecordsLocal(); // 從 localStorage 載入錯題記錄
        showSection(quizSection);
        displayQuestion();
        return;
    }

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
            // 在認證準備就緒後啟動 Firestore 監聽器
            listenToFormulas();
            listenToMistakeRecords();
        } else {
            // 如果沒有用戶登錄，嘗試匿名登錄
            try {
                await signInAnonymously(firebaseAuth); // GitHub Pages 預設使用匿名登入
                userId = firebaseAuth.currentUser?.uid || crypto.randomUUID(); // Fallback in case uid is null
                userInfoElem.textContent = `使用者 ID: ${userId} (匿名)`;
                showManageBtn.classList.remove('hidden'); // 匿名登入也顯示管理按鈕
                authReady = true;
                listenToFormulas();
                listenToMistakeRecords();
            } catch (error) {
                console.error("Firebase authentication failed:", error);
                userId = crypto.randomUUID(); // Fallback to a random ID if auth fails
                userInfoElem.textContent = `匿名使用者 ID: ${userId} (登入失敗)`;
                showManageBtn.classList.add('hidden'); // 登入失敗則隱藏管理按鈕
                authReady = true; // 即使失敗也標記為準備就緒，讓應用程式繼續
                // 如果認證失敗，還是需要嘗試載入題目 (可能沒有權限)
                listenToFormulas();
                await showCustomMessageBox("認證失敗", "無法登入 Firebase，部分功能可能受限。");
            }
        }
        hideLoadingSpinner();
        // 確保在認證準備就緒後顯示初始頁面
        showSection(quizSection);
        displayQuestion();
    });
}

// --- Firestore 數據監聽 ---
function listenToFormulas() {
    if (!firestoreDb || !authReady) {
        console.warn("Firestore not ready for formulas listener.");
        // 如果載入失敗，顯示沒有題目的訊息
        if (formulas.length === 0) {
            noFormulasMessage.classList.remove('hidden');
        }
        return;
    }
    const formulasColRef = collection(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`);
    onSnapshot(formulasColRef, (snapshot) => {
        formulas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Formulas loaded from Firestore:", formulas);
        initializeAllIngredients(); // 更新自動完成列表
        if (quizSection.classList.contains('hidden')) {
             // 如果不在問答頁面，不需要重新顯示問題
        } else {
            displayQuestion(); // 如果在問答頁面，重新顯示問題
        }
        renderManagedFormulas(); // 重新渲染管理列表
    }, (error) => {
        console.error("Error listening to formulas:", error);
        showCustomMessageBox("錯誤", "無法載入題目，請檢查網路連線。");
        // 如果載入失敗，顯示沒有題目的訊息
        if (formulas.length === 0) {
             noFormulasMessage.classList.remove('hidden');
        }
    });
}

function listenToMistakeRecords() {
    if (!firestoreDb || !authReady || userId === 'anonymous') {
        console.warn("Firestore or user not ready for mistake records listener. Falling back to LocalStorage.");
        loadMistakeRecordsLocal(); // 回退到 localStorage
        return;
    }
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
        showCustomMessageBox("錯誤", "無法載入錯題記錄，請檢查網路連線。");
    });
}


// --- 輔助函數：顯示/隱藏區塊 ---
function showSection(sectionToShow) {
    quizSection.classList.add('hidden');
    mistakesSection.classList.add('hidden');
    manageSection.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
}

function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
    quizSection.classList.add('hidden');
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
 * 初始化所有藥材名稱用於自動完成
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


// --- 核心問答邏輯 ---
/**
 * 顯示一道新的問題
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
 * 檢查使用者答案
 */
async function checkAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前題目可供檢查。");
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
        await addMistake(currentFormula.name, userAnswerInput.value, (currentFormula.ingredients || []).join('、'));
        await showCustomMessageBox("錯誤", `很抱歉，答案不完全正確。\n正確答案是：${(currentFormula.ingredients || []).join('、')}\n\n這題已加入錯題記錄。`);
    }

    // 鎖定輸入框和提交按鈕，顯示下一題按鈕
    userAnswerInput.disabled = true;
    submitAnswerBtn.classList.add('hidden');
    showCorrectAnswerBtn.classList.add('hidden'); // 提交後也隱藏顯示答案按鈕
    nextQuestionBtn.classList.remove('hidden');
}

/**
 * 顯示正確答案 (使用者主動點擊)
 */
async function showCorrectAnswer() {
    if (!currentFormula) {
        showCustomMessageBox("錯誤", "沒有當前題目可供顯示答案。");
        return;
    }

    // 顯示正確答案並加入錯題記錄
    feedbackMessageElem.classList.remove('hidden');
    feedbackMessageElem.textContent = `正確答案是：${(currentFormula.ingredients || []).join('、')}`;
    feedbackMessageElem.className = 'text-center text-lg font-medium text-yellow-600';

    // 即使使用者點擊顯示答案，也視為未答對，加入錯題記錄
    await addMistake(currentFormula.name, userAnswerInput.value, (currentFormula.ingredients || []).join('、'));

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
 */
async function addMistake(formulaName, userAnswer, correctAnswer) {
    const newRecord = {
        formulaName: formulaName,
        userAnswer: userAnswer || "未作答",
        correctAnswer: correctAnswer,
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
            record.correctAnswer === correctAnswer
        );
        if (!exists) {
            // 為本地記錄生成一個臨時 ID
            mistakeRecords.push({ ...newRecord, id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
            saveMistakeRecordsLocal();
            console.log("Mistake added to LocalStorage.");
        }
    }
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
        // 顯示 record.id 以便除錯或未來刪除單條記錄
        mistakeItem.innerHTML = `
            <h3 class="text-xl font-semibold text-blue-800 mb-2 break-words">${record.formulaName}</h3>
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

// --- 題目管理頁面邏輯 ---
function renderManagedFormulas() {
    formulaListElem.innerHTML = '';
    if (formulas.length === 0) {
        noManagedFormulasMessage.classList.remove('hidden');
    } else {
        noManagedFormulasMessage.classList.add('hidden');
    }

    formulas.forEach(formula => {
        const formulaItem = document.createElement('div');
        formulaItem.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0';
        formulaItem.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-semibold text-blue-800 mb-2 break-words">${formula.name}</h3>
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
    document.querySelectorAll('.edit-formula-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const formulaId = event.target.dataset.id;
            editFormula(formulaId);
        });
    });

    document.querySelectorAll('.delete-formula-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const formulaId = event.target.dataset.id;
            deleteFormula(formulaId);
        });
    });
}

/**
 * 開啟新增/編輯方劑彈窗
 * @param {string|null} formulaId 要編輯的方劑 ID，若為 null 則為新增模式
 */
function openFormulaModal(formulaId = null) {
    formulaForm.reset(); // 重置表單
    formulaModal.dataset.editId = formulaId; // 儲存當前編輯的 ID

    if (formulaId) {
        modalTitle.textContent = "編輯方劑";
        const formulaToEdit = formulas.find(f => f.id === formulaId);
        if (formulaToEdit) {
            formulaNameInput.value = formulaToEdit.name || '';
            formulaIngredientsInput.value = (formulaToEdit.ingredients || []).join(', ');
            formulaHintInput.value = formulaToEdit.hint || '';
        }
    } else {
        modalTitle.textContent = "新增方劑";
    }
    formulaModal.classList.remove('hidden');
}

/**
 * 關閉新增/編輯方劑彈窗
 */
function closeFormulaModal() {
    formulaModal.classList.add('hidden');
    formulaModal.dataset.editId = ''; // 清除編輯 ID
}

/**
 * 處理新增/編輯方劑的表單提交
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
    const editId = formulaModal.dataset.editId;

    if (firestoreDb && authReady && currentAppId) {
        try {
            if (editId) {
                // 編輯現有方劑
                await setDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`, editId), formulaData);
                await showCustomMessageBox("成功", "方劑更新成功！");
            } else {
                // 新增方劑
                await addDoc(collection(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`), formulaData);
                await showCustomMessageBox("成功", "新方劑新增成功！");
            }
            closeFormulaModal();
        } catch (e) {
            console.error("儲存方劑失敗:", e);
            await showCustomMessageBox("錯誤", "儲存方劑失敗，請檢查網路連線或權限。");
        }
    } else {
        // 如果沒有 Firebase 或認證未準備就緒，回退到 localStorage 處理
        if (editId) {
            const index = formulas.findIndex(f => f.id === editId);
            if (index !== -1) {
                formulas[index] = { ...formulaData, id: editId };
                await showCustomMessageBox("成功", "方劑已在本地更新！");
            }
        } else {
            formulas.push({ ...formulaData, id: `local-${Date.now()}` }); // 為本地新增的賦予一個臨時 ID
            await showCustomMessageBox("成功", "新方劑已在本地新增！");
        }
        localStorage.setItem('localFormulas', JSON.stringify(formulas)); // 儲存到本地
        renderManagedFormulas();
        closeFormulaModal();
    }
});

/**
 * 啟動編輯方劑流程
 * @param {string} formulaId 要編輯的方劑 ID
 */
function editFormula(formulaId) {
    openFormulaModal(formulaId);
}

/**
 * 啟動刪除方劑流程
 * @param {string} formulaId 要刪除的方劑 ID
 */
async function deleteFormula(formulaId) {
    const formulaToDelete = formulas.find(f => f.id === formulaId);
    const confirmDeletion = await showCustomMessageBox("確認刪除", `您確定要刪除方劑「${formulaToDelete ? formulaToDelete.name : '未知方劑'}」嗎？此操作不可恢復。`, true);
    if (confirmDeletion) {
        if (firestoreDb && authReady && currentAppId) {
            try {
                await deleteDoc(doc(firestoreDb, `artifacts/${currentAppId}/public/data/formulas`, formulaId));
                await showCustomMessageBox("成功", "方劑刪除成功！");
            } catch (e) {
                console.error("刪除方劑失敗:", e);
                await showCustomMessageBox("錯誤", "刪除方劑失敗，請檢查網路連線或權限。");
            }
        } else {
            // 回退到 localStorage 刪除
            const initialLength = formulas.length;
            formulas = formulas.filter(f => f.id !== formulaId);
            if (formulas.length < initialLength) {
                localStorage.setItem('localFormulas', JSON.stringify(formulas));
                await showCustomMessageBox("成功", "方劑已從本地刪除！");
                renderManagedFormulas();
            }
        }
    }
}


// --- 自動完成功能 ---
/**
 * 根據輸入顯示自動完成建議
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


// --- 事件監聽器 ---
document.addEventListener('DOMContentLoaded', () => {
    showLoadingSpinner();
    initializeFirebase(); // 啟動 Firebase 初始化和認證
});

showQuizBtn.addEventListener('click', () => {
    showSection(quizSection);
    displayQuestion(); // 切換到問答頁面時重新載入問題
});

showMistakesBtn.addEventListener('click', () => {
    showSection(mistakesSection);
    renderMistakes(); // 切換到錯題頁面時渲染錯題
});

showManageBtn.addEventListener('click', () => {
    showSection(manageSection);
    renderManagedFormulas(); // 切換到管理頁面時渲染題目
});

submitAnswerBtn.addEventListener('click', checkAnswer);
showCorrectAnswerBtn.addEventListener('click', showCorrectAnswer);
nextQuestionBtn.addEventListener('click', displayQuestion);
clearMistakesBtn.addEventListener('click', clearAllMistakes);
addFormulaBtn.addEventListener('click', () => openFormulaModal()); // 開啟新增模式

// 彈窗的取消按鈕
cancelFormulaBtn.addEventListener('click', closeFormulaModal);

// 輸入框監聽器，用於自動完成
userAnswerInput.addEventListener('input', (event) => {
    showAutocompleteSuggestions(event.target.value);
});

// 點擊輸入框外隱藏自動完成列表
document.addEventListener('click', (event) => {
    if (!userAnswerInput.contains(event.target) && !autocompleteResults.contains(event.target) && !formulaModal.contains(event.target)) {
        autocompleteResults.classList.add('hidden');
    }
});

// 按下 Esc 鍵也隱藏自動完成列表
userAnswerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        autocompleteResults.classList.add('hidden');
    }
});

// 處理 Enter 鍵提交答案，而不是換行
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
