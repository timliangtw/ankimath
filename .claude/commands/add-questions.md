# /add-questions

從 `image/<bank>/` 資料夾讀取圖片，自動分析題目並產生對應的 `js/questions/<bank>/qXXX.js` 題目檔案，最後 commit + push。

**題庫（bank）：** 目前有兩個獨立題庫，圖片放在哪個資料夾就寫進哪個題庫，兩邊編號各自獨立。
- `brother`（哥哥）→ 圖片 `image/brother/`、題目 `js/questions/brother/`
- `sister`（妹妹，profile 名稱 natasha）→ 圖片 `image/sister/`、題目 `js/questions/sister/`

## 執行步驟

### Step 1：掃描圖片

分別列出 `image/brother/` 與 `image/sister/` 底下所有圖片（jpg/png/jpeg），排除各自的 `processed/` 子目錄。
若兩邊都沒有圖片，告知使用者並停止。

**重複圖片檢查：** 對每張圖片，先確認同題庫的 `image/<bank>/processed/` 裡是否已有**同檔名**的圖片：
- 若已存在 → 跳過這張，在摘要中列出「已跳過（已處理過）」
- 若不存在 → 繼續處理

若所有圖片都已處理過，告知使用者並停止。

### Step 2：確認下一個題目編號

**依題庫分別計算。** 列出該題庫的 `js/questions/<bank>/q0*.js`，找出最大編號，下一題從該編號 +1 開始。
（brother 與 sister 的編號互不相干，可以同時存在 `brother/q009.js` 與 `sister/q009.js`。）

### Step 3：逐張圖片處理

對每張圖片依序執行以下流程：

#### 3a. 讀取並分析圖片

用 Read 工具讀取圖片（視覺分析）。忽略所有手寫筆跡（塗鴉、算式、數字標記），只擷取**印刷文字的題目內容**。

分析並記錄：
- **題目文字**（完整）
- **題型**：選擇題（幾選幾）、填空、計算、判斷
- **數字**：哪些數字是題目的關鍵變數（適合隨機化）
- **正確答案**
- **解題說明**（計算過程）

#### 3b. 判斷隨機化策略

思考這題的數字是否適合每次複習時隨機化：
- 若是應用題（加減乘除關係明確）→ **設計隨機化生成邏輯**，確保答案永遠是整數、數字在小學生合理範圍
- 若是概念題（圖形、順序、定義）→ 可固定數字，但選項仍可隨機排列

#### 3c. 產生 qXXX.js

依照現有題目風格（參考 `js/questions/brother/q017.js` 為範本，空白樣板為 `js/questions/模板.js`）撰寫新題目：

**必要規範：**
1. 使用 React + htm，`const { useState, useEffect, useCallback } = React;`
2. 答錯時必須呼叫 `if (window.onIncorrectAnswer) window.onIncorrectAnswer();`
3. 答對時顯示解題計算步驟
4. 選擇題使用 2×2 grid 佈局（或 1 列，依選項數量決定）
5. 有「再試一題（換數字）」按鈕（若有隨機化）
6. `export default` 包含 `id`、`type: 'custom'`、`title`、`q`、`render`
7. Tailwind CSS 配色風格與現有題目一致（amber/green/red/blue）

**⚠️ 常見錯誤（一定要避免）：**

**錯誤 A：inline style 用字串**
```javascript
// ❌ 錯誤：React dev 版會直接拋錯，造成題目空白
<table style="max-width:320px; margin:0 auto;">

// ✅ 正確：style 必須是物件
<table style=${{maxWidth: '320px', margin: '0 auto'}}>
```

**錯誤 B：答錯後鎖住所有選項**
```javascript
// ❌ 錯誤：答錯後 gameState='wrong'，選項全部 disabled，學生無法重試
if (gameState !== 'playing') return;
const isDisabled = gameState !== 'playing' && !isSelected;

// ✅ 正確：只有答對後才鎖，答錯可以繼續選
if (gameState === 'correct') return;
const isDisabled = gameState === 'correct' && !isSelected;
```

**錯誤 C：答錯後送出按鈕消失（填空題型）**
```javascript
// ❌ 錯誤：!feedback 讓送出按鈕在答錯後消失，學生卡住
${!feedback && html`<button onClick=${checkAnswer}>送出答案</button>`}

// ✅ 正確：只有答對後才隱藏送出按鈕
${feedback !== 'correct' && html`<button onClick=${checkAnswer}>送出答案</button>`}
```

**答對回饋區必須包含：**
- 題目關鍵計算步驟（逐行列出）
- 最終答案高亮顯示

#### 3d. 寫入檔案

將產生的程式碼寫入該題庫資料夾 `js/questions/<bank>/qXXX.js`。
（`js/questions/index.js` 會自動依序 dynamic import `./<bank>/q001.js`、`q002.js`…，編號必須連續，中間最多不能斷 3 個以上，不需要另外註冊。）

#### 3e. 移動圖片

將處理完的圖片移動到同題庫的 `image/<bank>/processed/` 資料夾（若不存在則建立）。

### Step 4：更新版本號

執行：
```bash
NOW=$(date +"%y.%m.%d %H:%M") && printf 'export const VERSION = '"'"'v%s'"'"';\n' "$NOW" > js/version.js
```

### Step 5：驗證

用 Node.js 腳本快速驗證新題目的核心邏輯（generateProblem 函式）：
- 若有隨機化：執行 1000 次，確認答案為整數、選項無重複、選項含正確答案
- 若無隨機化：確認 export default 結構正確

### Step 6：Commit + Push

```bash
git add js/questions/<bank>/qXXX.js js/version.js image/
git commit -m "feat: add <bank> qXXX <題目標題簡述>"
git push origin main
```

### Step 7：等待部署並確認上線

```bash
until curl -sf "https://timliangtw.github.io/ankimath/js/questions/<bank>/qXXX.js" -o /dev/null; do sleep 5; done
```

確認上線後跑 E2E 測試（`test_e2e.mjs`），回報結果。
測試網址可加 `?bank=sister` 切換到妹妹題庫驗證。

---

## 注意事項

- 若同一張圖有多個題目，每個題目建一個獨立的 qXXX.js 檔案
- 若圖片模糊看不清楚，告知使用者該圖片無法處理，跳過並繼續下一張
- 不要修改任何既有題目，只新增檔案
- 每次只處理 `image/brother/`、`image/sister/` 根目錄下的圖片（不遞迴處理 processed 子目錄）
- 圖片一定要放在正確的題庫資料夾，放錯就會寫進錯的小孩題庫
- 分析題目時如果有歧義，選擇最符合小學數學邏輯的解讀
