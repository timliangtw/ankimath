# /add-questions

從 `image/` 資料夾讀取圖片，自動分析題目並產生對應的 `qXXX.js` 題目檔案，最後 commit + push。

## 執行步驟

### Step 1：掃描圖片

列出 `image/` 資料夾中所有圖片（jpg/png/jpeg），排除 `image/processed/` 子目錄。
若沒有圖片，告知使用者並停止。

### Step 2：確認下一個題目編號

列出 `js/questions/q0*.js`，找出最大編號，下一題從該編號 +1 開始。

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

依照現有題目風格（參考 `js/questions/q017.js` 為範本）撰寫新題目：

**必要規範：**
1. 使用 React + htm，`const { useState, useEffect, useCallback } = React;`
2. 答錯時必須呼叫 `if (window.onIncorrectAnswer) window.onIncorrectAnswer();`
3. 答對時顯示解題計算步驟
4. 選擇題使用 2×2 grid 佈局（或 1 列，依選項數量決定）
5. 有「再試一題（換數字）」按鈕（若有隨機化）
6. `export default` 包含 `id`、`type: 'custom'`、`title`、`q`、`render`
7. Tailwind CSS 配色風格與現有題目一致（amber/green/red/blue）

**答對回饋區必須包含：**
- 題目關鍵計算步驟（逐行列出）
- 最終答案高亮顯示

#### 3d. 寫入檔案

將產生的程式碼寫入 `js/questions/qXXX.js`。

#### 3e. 移動圖片

將處理完的圖片移動到 `image/processed/` 資料夾（若不存在則建立）。

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
git add js/questions/qXXX.js js/version.js
git commit -m "feat: add qXXX <題目標題簡述>"
git push origin main
```

### Step 7：等待部署並確認上線

```bash
until curl -sf "https://timliangtw.github.io/ankimath/js/questions/qXXX.js" -o /dev/null; do sleep 5; done
```

確認上線後跑 E2E 測試（`test_e2e.mjs`），回報結果。

---

## 注意事項

- 若同一張圖有多個題目，每個題目建一個獨立的 qXXX.js 檔案
- 若圖片模糊看不清楚，告知使用者該圖片無法處理，跳過並繼續下一張
- 不要修改任何現有的 q001~q016 等既有題目
- 每次只處理 `image/` 根目錄下的圖片（不遞迴處理 processed 子目錄）
- 分析題目時如果有歧義，選擇最符合小學數學邏輯的解讀
