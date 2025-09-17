# 商業模式 (Business Model)
- 由「代幣經濟學」和「任務飛輪」共同構成的閉環生態系。代幣經濟學定義了每個 AI Agent 的內在價值和價值流動方式，而任務飛輪則是持續為這個生態系注入新 Agent 和新參與者的增長引擎。

**核心經濟循環：Agent 即業務 (The Agent as a Business)**
每個在平台上創建的 AI Agent 都擁有自己獨立的經濟體系，主要由兩種核心資產構成：
- Agent NFT (使用授權)：這是使用特定 AI Agent 的官方許可證。除了創作者，任何希望使用該 Agent 功能的用戶都必須鑄造 (Mint) 一個對應的 NFT。
- Agent ERC20 代幣 (股權)：這代表了該 AI Agent 的「股權」。代幣持有者即為該 Agent 的股東，有權分享其產生的收入。

價值流動機制如下：
- 創立 Agent 與資產：創作者透過平台開發管線創建 AI Agent，系統會提供 NFT 收藏品合約和 ERC20 代幣合約選項，讓創作者付費使用。
- 用戶購買授權 (NFT Mint)：用戶支付 ETH 鑄造 NFT 以使用 Agent，費用流入該 Agent 的質押池 (Staking Pool)。
- 投資者購買股權 (Token Purchase)：投資者可購買代表 Agent 股權的 ERC20 代幣。代幣價格由線性聯合曲線 (Linear Bonding Curve) 的數學公式決定，購買即上漲，賣出則下跌，無需外部流動性。
- 股東質押與分潤：ERC20 代幣持有者（股東）將代幣質押到質押池中，並根據其質押比例，自動分享池中累積的 NFT 鑄造收入。

**增長引擎：任務飛輪 (Missions Flywheel)**
- 主題賽季：有需求的使用者可以發布不同的開發「任務」主題（如：社群媒體管理賽季），引導開發者社群進行創作。
- 開發者競賽：開發者提交他們創建的新 Agent 參加競賽，爭奪獎金池。
- 生態整合：獲勝的優秀 Agent 會被平台重點推薦和整合，啟動新一輪的 NFT 鑄造和股權投資循環。

**詳細代幣經濟學工作流程**
以下步驟詳細說明了從資產創建到價值分配的完整生命週期。
- 階段一：創立與設定 (步驟 1, 3, 7)，此階段由創作者 (Creator) 驅動，為其 AI Agent 的經濟體系建立基礎資產。
    - 步驟 1: 創建 NFT 收藏品 (The "License")
    創作者與 NFT 工廠合約互動，啟動一個新的 NFT 收藏品，定義 Agent 的「使用授權」，並設定 ETH 的鑄造價格。
    - 步驟 3: 創建 ERC20 代幣 (The "Equity")
    創作者與 ERC20 工廠合約互動，發行一個新的 ERC20 代幣，並將其與前述的 NFT 收藏品綁定，確立其作為該 Agent 的官方「股權」。
    - 步驟 7: 創建質押池 (The "Treasury")
    創作者使用質押池工廠合約為 Agent 創建一個專屬的金庫。此合約會自動收集所有 NFT 鑄造收入，並將其作為獎勵分配給已質押的代幣持有者。

- 階段二：市場活動 (步驟 2, 5, 6)，此階段涉及用戶和投資者與 Agent 資產的互動，從而驅動市場動態和價值創造。
    - 步驟 2: 用戶鑄造 NFT (產生收入)
    希望使用 AI Agent 的用戶支付 ETH 鑄造 NFT。這筆收入會立即發送到質押池。
    - 步驟 4 & 5: 投資者購買代幣 (價格發現與資本流入)
    ERC20 代幣的價格由線性聯合曲線演算法決定。投資者購買代幣時，供應量增加，價格依公式自動上漲。
    - 步驟 6: 投資者出售代幣 (價格調整與資本流出)
    投資者可以隨時將代幣賣回給聯合曲線合約。合約會從其儲備中退款，售出的代幣被銷毀，總供應量減少，價格隨之降低。

- 階段三：質押與分潤 (步驟 8, 9)，這是核心的價值捕獲階段，股權持有者（代幣質押者）從 Agent 的使用中賺取被動收入。
    - 步驟 8: 用戶質押代幣
    ERC20 代幣持有者將其代幣鎖定在質押池中，以獲得收入分享的資格。
    - 步驟 9: 收入分配給質押者
    當新的 NFT 鑄造收入進入質押池時，這些資金即可由質押者領取。分配的計算基於每位用戶在收入產生時所佔的總質押比例。

# 技術高階設計 (Tech High-Level Design)
平台的技術架構是實現上述商業模式的基石，其核心是一個結合了 V-Model 開發模型與測試驅動開發 (TDD) 的多 Agent 自動化管線。這個管線就是生產 AI Agent（數位業務）的工廠。

**核心方法論：V-Model 與測試驅動開發 (TDD)**
- 系統的 AI Agent 分為開發型、品保 (QA) 型和驗證 (Validator) 型。
- 遵循 TDD 原則，QA Agent 會在每個開發階段開始前，先生成對應的測試案例。開發 Agent 的目標就是產出能通過這些測試的設計或程式碼，從源頭確保品質。
- 七階段 AI Agent 管線 (7-Stage Pipeline)
    - 需求分析：解析用戶需求，特別是 Web3 相關功能。
    - 資訊收集：透過可插拔 MCP 協議，從外部（如鏈上數據、第三方 API）獲取必要資訊。
    - 系統整合設計：設計高階架構和模組互動。
    - 數據結構設計：生成資料庫 Schema (e.g., Prisma)。
    - 模組設計：進行詳細的 API 和內部邏輯設計。
    - 實作：生成最終的全端應用程式碼。
    - 最終測試：執行所有先前生成的測試，確保應用程式的品質。

**關鍵架構組件**
- 主應用程式 (MainApp)：用戶與平台互動的前端介面。
- Agent 網路 (Agent Network)：所有 AI Agent 的集合，透過 A2A (Agent-to-Agent) 協議進行通訊。
- 可插拔 MCP 伺服器：允許用戶連接自定義的工具和數據源，是實現高度客製化 Agent 的關鍵。

# 基礎設施規劃 (Infrastructure Plan)
### 基礎設施即程式碼 (IaC) 工具：Terraform**
- 平台無關性：Terraform 的 Provider 機制可以無縫管理 Vercel 和 AWS 的資源，這對於我們分階段的基礎設施計劃至關重要。
- 可複現性：所有基礎設施配置都將以程式碼形式存儲在 Git 中，確保開發、測試和生產環境的一致性。
- 自動化：便於整合到 CI/CD 流程中，實現基礎設施的自動化部署與變更。

### **階段一：短期計劃 (Vercel 生態系)**
- 託管與運算：Next.js 前端和所有 Agent API 後端都部署為 Vercel Serverless Functions。
- 核心資料庫：Vercel Postgres 和 Neon 用於主應用和 Agent 的多租戶數據存儲。
    - Architecture for using Neon:
        - database share the same bill, the cost depends on the usage 
        - one Neon project per licenced agent, create different database in one instance
            - Pros:
                - good isolation
                - avoid creating too many neon instances
            - https://neon.com/pricing
                - could consider using "Launch" program
- 快取與訊息佇列：Vercel KV (Redis) 用於 Agent 間的非同步通訊。
- 檔案儲存：Vercel Blob 用於存儲 AI 生成的程式碼、測試報告等產物。


***

**Vercel Delivery Network (邊緣網絡)**

|計費項目 (Billing Item)  |  Pro 方案每月免費額度  |  超出額度後收費標準  |  說明|
| -------- | ------- | -------- | ------- |
|Edge Requests  |  1,000 萬次  |  每 100 萬次 $2.25  |  您的網站或應用被訪問的總次數。|
|Edge Middleware Invocations  |  100 萬次  |  每 100 萬次 $0.65  |  在邊緣執行的 Middleware (例如，用於驗證、重定向) 被呼叫的次數。|
|Fast Data Transfer (Bandwidth)  |  1 TB  |  每 GB $0.15  |  核心帶寬費用。從 Vercel 邊緣網絡向用戶傳輸的總數據量。|
|Edge Request CPU Duration  |  1 小時  |  遵循合理使用原則  |  邊緣 Middleware 消耗的總 CPU 時間。Pro 方案通常不直接對此收費，除非用量極端。|

***
**Vercel Functions (無伺服器函數)**

|計費項目 (Billing Item)  |  Pro 方案每月免費額度  |  超出額度後收費標準  |  說明|
| -------- | ------- | -------- | ------- |
|Function Duration  |  1,000 GB-小時  |  每 100 GB-小時 $18  |  核心運算成本。等於 (函數運行秒數 * 分配的記憶體 GB)。您帳單中的 Fluid 指標已被此項取代。|
|Function Invocations  |  100 萬次  |  每 100 萬次 $0.60  |  您的 Serverless Functions API 被呼叫的總次數。|
|Fast Origin Transfer  |  100 GB  |  每 GB $0.05  |  Vercel 邊緣網絡與您的 Serverless Function 之間的內部數據傳輸量。|

***
**Content, Caching & Optimization (內容、快取與優化)**

|計費項目 (Billing Item)  |  Pro 方案每月免費額度  |  超出額度後收費標準  |  說明|
| -------- | ------- | -------- | ------- |
|Blob Storage Size  |  5 GB  |  每 GB/月 $0.20  |  Vercel Blob 中存儲的總檔案大小（例如您生成的程式碼或測試報告）。|
|ISR Reads  |  1,000 萬次  |  每 100 萬次 $2.00  |  從 Vercel 的數據快取中讀取數據的次數 (用於增量靜態再生 ISR)。|
|ISR Writes  |  200 萬次  |  每 100 萬次 $5.00  |  向 Vercel 的數據快取中寫入數據的次數。|

***
**AI model usage**

| 模型  |  輸入 (Input) / 百萬 Tokens  | 輸出 (Output) / 百萬 Tokens  |  價格來源 |
| -------- | ------- | -------- | ------- |
| OpenAI gpt-4o-mini  |  $0.15  |  $0.60  |  OpenAI 官方定價 |
| xAI grok-3 (Llama-3-70B-F-8K)  |  ~$0.59  |  ~$0.79  |  Fireworks AI (Vercel Marketplace) |



***
***
**平均一個 running agent 每日所需資源**
- 以 merket-assistant-pro 在 8 月的使用量為例
- 假設 running agent invoke 15 function/day

|資源類別  |  計費項目 (Billing Item)  |  平均每位 DAU 的「每日」消耗  |  來源與計算方式|
| -------- | ------- | -------- | ------- |
|邊緣網絡  |  Edge Requests  |  ~69 次  |  [計算得出] (15 次 API * 3.25) + (1 次頁面載入 * 20) = 48.75 + 20|
||Edge Middleware Invocations  |  ~0 次  |  [預估值] 核心邏輯不在 Middleware 中。|
||Fast Data Transfer (Bandwidth)  |  ~0.78 MB  |  [計算得出] (15 次 API * 0.032 MB) + (1 次頁面載入 * 0.3 MB) = 0.48 + 0.3|
||Edge Request CPU Duration  |  ~0 秒  |  [預估值] 基於無 Middleware 的假設。|
|無伺服器函數  |  Function Duration  |  ~5.75 GB-秒  |  [計算得出] 15 次 API * 0.383 GB-秒|
||Function Invocations  |  15 次  |  [定義] 這是我們對 DAU 互動頻率的假設。|
||Fast Origin Transfer  |  ~84 kB  |  [計算得出] 15 次 API * 5.6 kB|
|內容與快取  |  Blob Storage Writes  |  ~0.75 次寫入 (每次 100kB)  |  [預估值] 15 次 API * 0.05|
||ISR Reads / Writes  |  ~10 次讀取 / ~0.3 次寫入  |  [預估值] 假設前端頁面有少量增量靜態內容。|
|外部服務  |  LLM API (Token Cost)  |  OpenAI gpt-4o-mini: ~$0.00135, xAI grok-3: $0.00217   |  [預估值] 假設每呼叫十次 function 會使用一次 LLM API, 每次使用 3000 token|

***
***
**單一 license agent 月度用量預測 (10 個 running agent)**
- 一位「running agent」平均每天 15 次 Function Invocations。
- 每月以 30 天計算
- 總月度調用次數 = 10 Running Agent * 15 次/天 * 30 天 = 4,500 次/月

|資源類別  |  計費項目 (Billing Item)  |  預估每月總用量 (1 Agent, 10 DAU)  |
| -------- | ------- | -------- |
|邊緣網絡  |  Edge Requests  |  20,700 次  |
||Fast Data Transfer (Bandwidth)  |  234 MB  |
|無伺服器函數  |  Function Duration  |  ~0.48 GB-小時  |
||Function Invocations  |  4,500 次  |
||Fast Origin Transfer  |  25.2 MB  |
|內容與快取  |  Blob Storage (月增量)  |  ~22.5 MB  |
||ISR Reads / Writes  |  ~3,000 次讀取 / ~90 次寫入  |
||Neon DB (Monthly Cost)  |  儲存：50 MB, 運算：15 vCPU-小時  |
|外部服務  |  LLM API (Token Cost)  |  OpenAI gpt-4o-mini: ~$6.075, xAI grok-3: $9.765  |


***
***
**AI Agent方案成本分析**
| 資源類別  |  計費項目 (Billing Item)  |  免費額度可支持的 Agent 數量  |  每增加一個 Agent 的邊際成本 (月費)|
| -------- | ------- | -------- | -------- |
|邊緣網絡  |  Edge Requests  |  483 個  |  (20,700 / 1M) * $2.25 ≈ $0.047|
||Fast Data Transfer  |  4,273 個  |  0.234 GB * $0.15 ≈ $0.035|
|無伺服器函數  |  Function Duration  |  2,083 個  |  (0.48 GB-Hrs / 100) * $18 ≈ $0.086|
||Function Invocations  |  222 個  |  (4,500 / 1M) * $0.60 = $0.0027|
||Fast Origin Transfer  |  3,968 個  |  0.0252 GB * $0.05 ≈ $0.0013|
|內容與快取  |  Blob Storage  |  222 個  |  0.0225 GB * $0.20 ≈ $0.0045|
||ISR Reads / Writes  |  極高 (遠超過千個)  |  趨近於 $0|
|外部服務  |  Neon DB  |  0 個  |  ~$2.41|
||LLM API  |  0 個  |  ~$6.08 至 $9.77|


***
***
**ROM AI 平均一個 DAU 月使用量**
- 以 ROM-AI 在 8 月的使用量為例
- 假設使用量為 5 個 DAU

|資源類別  |  計費項目 (Billing Item)  |  平均每位 DAU 的「每日」消耗  |  來源與計算方式|
| -------- | ------- | -------- | -------- |
|邊緣網絡  |  Edge Requests  |  ~92.7 次  |  [計算得出] 13,910 次 / 150 |
||Fast Data Transfer (Bandwidth)  |  ~3.23 MB  |  [計算得出] 485 MB / 150 |
||Edge Request CPU Duration  |  ~3.2 毫秒  |  [計算得出] 480 毫秒 / 150 |
|無伺服器函數  |  Function Duration  |  ~38.64 GB-秒  |  [計算得出] (1.61 GB-小時 * 3600 秒) / 150 |
||Function Invocations  |  ~68.5 次  |  [計算得出] 10,280 次 / 150 |
||Fast Origin Transfer  |  ~0.83 MB  |  [計算得出] 125 MB / 150 |
|內容與快取  |  ISR Reads  |  ~10 次  |  [計算得出] 1,500 次 / 150 |
||ISR Writes  |  ~0.47 次  |  [計算得出] 70 次 / 150 |


***
***
**ROM AI 方案成本分析**
- 假設每多一個 Agent 整個 ROM-AI 的 DAU 多增加十個

|資源類別  |  計費項目 (Billing Item)  |  免費額度可支持的 Agent 數量  |  每增加一個 Agent 的邊際成本 (月費)|
| -------- | ------- | -------- | -------- |
|邊緣網絡  |  Edge Requests  |  206 個  |  (48,520 / 1M) * $2.25 ≈ $0.109|
||Edge Middleware Invocations  |  極高  |  趨近於 $0|
||Fast Data Transfer  |  830 個  |  1.204 GB * $0.15 ≈ $0.18|
||Edge Request CPU Duration  |  極高  |  趨近於 $0|
|無伺服器函數  |  Function Duration  |  270 個  |  (3.70 GB-Hrs / 100) * $18 ≈ $0.666|
||Function Invocations  |  39 個  |  (25,060 / 1M) * $0.60 = $0.015|
||Fast Origin Transfer  |  363 個  |  0.275 GB * $0.05 ≈ $0.014|
|內容與快取  |  Blob Storage  |  222 個  |  0.0225 GB * $0.20 ≈ $0.0045|
||ISR Reads / Writes  |  極高  |  趨近於 $0|
||  Neon DB  |  0 個  |  ~$2.41|
|外部服務  |LLM API  |  0 個  |  ~$6.08 至 $9.77|



### **階段二：長期計劃 (遷移至 AWS 生態系)**
consider migrating to AWS after having over 100 license Agent, since the price for using Vercel will go up drastically:
- Neon
    - from 0.14 CU-hour to 0.26 CU-hour
    - https://neon.com/pricing


| Vercel 服務 | AWS 對應服務 | 說明 |
| -------- | ------- | -------- |
| Vercel Serverless Functions | AWS Lambda + Amazon API Gateway | Lambda 負責執行 Agent 運算，API Gateway 提供 HTTP 端點。 |
| Vercel Hosting (Edge) | AWS Amplify Hosting 或 S3 + CloudFront | Amplify Hosting 提供最接近 Vercel 的 CI/CD 和部署體驗。 |
| Vercel Postgres / Neon | Amazon Aurora Serverless v2 (PostgreSQL) | 提供與 Neon 類似的無伺服器、自動擴展的資料庫能力。 |
| Vercel KV (Redis) | Amazon ElastiCache for Redis | 提供託管的 Redis 服務，用於快取和訊息佇列。 |
| Vercel Blob | Amazon S3 (Simple Storage Service) | 用於對象存儲，存儲生成的程式碼和大型文件。 |
| Vercel Cron Jobs | Amazon EventBridge Scheduler | 用於觸發定時的 Lambda 函數，執行排程任務。 |

- Architecture for using Amazon Aurora Serverless v2 (PostgreSQL) :
    - One Cluster, One Database per Project
        - Each project gets its own logical database (CREATE DATABASE projectA; CREATE DATABASE projectB;).
        - Inside each database, you create that project’s tables.
        - Pros:
            - Clear separation of data.
            - Easier to back up / drop a project without affecting others.
            - Same cluster resources are shared (cheaper).
                - setting up a cluster might have some additional cost
                    - baseline costs (metadata storage, backups, connection management, monitoring).
                    - each project’s cluster has to scale independently. This means less efficient utilization → higher cost overall.
                        - Example: Project A uses 2 ACUs, Project B idle → you still pay 2 ACUs for A’s cluster, 0 ACU for B’s cluster, plus duplicated storage/system overhead.


***
### **AWS 基礎設施成本分析 (以 us-east-1 N. Virginia 為例)**

***
**AWS Edge & Compute (CloudFront, API Gateway, Lambda)**

| 計費項目 (Billing Item) | AWS 免費額度 (每月) | 超出額度後收費標準 | 說明 |
| --- | --- | --- | --- |
| CloudFront Requests | 100 萬次 | 每 100 萬次 $1.00 | 對應 Vercel Edge Requests，用於提供前端內容和 API 路由。 |
| API Gateway Requests | 100 萬次 (首年) | 每 100 萬次 $1.00 | 用於觸發 Lambda 函數的 HTTP API 端點。 |
| Lambda Invocations | 100 萬次 | 每 100 萬次 $0.20 | 對應 Vercel Function Invocations，函數被呼叫的總次數。 |
| Lambda Duration | 400,000 GB-秒 | 每 GB-秒 $0.00001667 | 核心運算成本，對應 Vercel Function Duration。 |
| CloudFront Data Transfer | 1 TB | 每 GB $0.085 | 對應 Vercel Fast Data Transfer，從邊緣向用戶傳輸的數據。 |
| Lambda to Internet Data Transfer | 100 GB | 每 GB $0.09 | 從 Lambda 函數向外傳輸的數據。 |

***
**AWS Storage & Database (S3, Aurora)**

| 計費項目 (Billing Item) | AWS 免費額度 (每月) | 超出額度後收費標準 | 說明 |
| --- | --- | --- | --- |
| S3 Standard Storage | 5 GB (首年) | 每 GB/月 $0.023 | 對應 Vercel Blob Storage，用於存儲程式碼產物和文件。 |
| S3 PUT, COPY, POST Requests | 2,000 次 (首年) | 每 1,000 次 $0.005 | 對應 Vercel Blob Writes，寫入 S3 的操作。 |
| Aurora Serverless v2 ACU | 無 (按需付費) | 每 ACU-小時 ~$0.12 | 資料庫運算能力，1 ACU ≈ 2GB RAM。 |
| Aurora Database Storage | 無 (按需付費) | 每 GB/月 $0.20 | 資料庫儲存空間。 |

***
**AI model usage**

| 模型 | 輸入 (Input) / 百萬 Tokens | 輸出 (Output) / 百萬 Tokens | 價格來源 |
| --- | --- | --- | --- |
| OpenAI gpt-4o-mini | $0.15 | $0.60 | OpenAI 官方定價 |
| xAI grok-3 (Llama-3-70B-F-8K) | ~$0.59 | ~$0.79 | Fireworks AI (Vercel Marketplace) |

***
***
**平均一個 running agent 每日所需資源 (基於 AWS)**
- 以 merket-assistant-pro 在 8 月的使用量為例
- 假設一個 running agent invoke 15 function/day

| 資源類別 | 計費項目 (Billing Item) | 平均每位 DAU 的「每日」消耗 | 來源與計算方式 |
| --- | --- | --- | --- |
| 邊緣與運算 | CloudFront/API Gateway Requests | ~69 次 | [計算得出] (15 次 API * 3.25) + (1 次頁面載入 * 20) = 48.75 + 20 |
| | Lambda Invocations | 15 次 | [定義] 這是我們對 DAU 互動頻率的假設。 |
| | Lambda Duration | ~5.75 GB-秒 | [計算得出] 15 次 API * 0.383 GB-秒 |
| | CloudFront Data Transfer | ~0.78 MB | [計算得出] (15 次 API * 0.032 MB) + (1 次頁面載入 * 0.3 MB) = 0.48 + 0.3 |
| 儲存與資料庫 | S3 PUT Requests | ~0.75 次寫入 (每次 100kB) | [預估值] 15 次 API * 0.05 |
| 外部服務 | LLM API (Token Cost) | OpenAI gpt-4o-mini: ~$0.00135, xAI grok-3: $0.00217 | [預估值] 假設每呼叫十次 function 會使用一次 LLM API, 每次使用 3000 token |

***
***
**單一 license Agent 月度用量預測 (10 * running agent)**
- 一位「日活躍用戶」平均每天會與 Agent 進行 15 次互動 (Lambda Invocations)。
- 每月以 30 天計算
- 總月度調用次數 = 10 位用戶 * 15 次/天 * 30 天 = 4,500 次/月

| 資源類別 | 計費項目 (Billing Item) | 預估每月總用量 (1 Agent, 10 DAU) |
| --- | --- | --- |
| 邊緣與運算 | CloudFront/API Gateway Requests | 20,700 次 |
| | Lambda Invocations | 4,500 次 |
| | Lambda Duration | ~1,725 GB-秒 (≈ 0.48 GB-小時) |
| | CloudFront Data Transfer | 234 MB |
| 儲存與資料庫 | S3 Storage (月增量) | ~22.5 MB |
| | Aurora DB (Monthly Cost) | 儲存：50 MB, 運算：~0.5 ACU-小時 (預估值) |
| 外部服務 | LLM API (Token Cost) | OpenAI gpt-4o-mini: ~$6.075, xAI grok-3: $9.765 |

***
***
**AI Agent 方案成本分析 (基於 AWS)**

| 資源類別 | 計費項目 (Billing Item) | 免費額度可支持的 Agent 數量 | 每增加一個 Agent 的邊際成本 (月費) |
| --- | --- | --- | --- |
| 邊緣與運算 | CloudFront/API Gateway Requests | 48 個 | (20,700 / 1M) * $1.00 ≈ $0.021 |
| | Lambda Invocations | 222 個 | (4,500 / 1M) * $0.20 ≈ $0.0009 |
| | Lambda Duration | 231 個 | 1,725 GB-秒 * $0.00001667 ≈ $0.0288 |
| | CloudFront Data Transfer | 4,273 個 | 0.234 GB * $0.085 ≈ $0.02 |
| 儲存與資料庫 | S3 Storage | 222 個 (首年) | 0.0225 GB * $0.023 ≈ $0.0005 |
| | S3 PUT Requests | 88 個 (首年) | (22.5 / 1000) * $0.005 ≈ $0.0001 |
| | Aurora DB | 0 個 | ~$1.00 (預估最低費用) |
| 外部服務 | LLM API | 0 個 | ~$6.08 至 $9.77 |

***
***
**ROM AI 平均一個 DAU 月使用量 (基於 AWS)**
- 以 ROM-AI 在 8 月的使用量為例
- 假設使用量為 5 個 DAU

| 資源類別 | 計費項目 (Billing Item) | 平均每位 DAU 的「每日」消耗 | 來源與計算方式 |
| --- | --- | --- | --- |
| 邊緣與運算 | CloudFront/API Gateway Requests | ~92.7 次 | [計算得出] 13,910 次 / 150 |
| | Lambda Invocations | ~68.5 次 | [計算得出] 10,280 次 / 150 |
| | Lambda Duration | ~38.64 GB-秒 | [計算得出] (1.61 GB-小時 * 3600 秒) / 150 |
| | CloudFront Data Transfer | ~3.23 MB | [計算得出] 485 MB / 150 |

***
***
**ROM AI 方案成本分析 (基於 AWS)**
- 假設每多一個 Agent 整個 ROM-AI 的 DAU 多增加十個

| 資源類別 | 計費項目 (Billing Item) | 免費額度可支持的 Agent 數量 | 每增加一個 Agent 的邊際成本 (月費) |
| --- | --- | --- | --- |
| 邊緣與運算 | CloudFront/API Gateway Requests | 20 個 | (48,520 / 1M) * $1.00 ≈ $0.049 |
| | Lambda Invocations | 39 個 | (25,060 / 1M) * $0.20 ≈ $0.005 |
| | Lambda Duration | 34 個 | (11,592 GB-秒) * $0.00001667 ≈ $0.193 |
| | CloudFront Data Transfer | 830 個 | 1.204 GB * $0.085 ≈ $0.102 |
| 儲存與資料庫 | S3 Storage | 222 個 (首年) | 0.0225 GB * $0.023 ≈ $0.0005 |
| | Aurora DB | 0 個 | ~$1.00 (預估最低費用) |
| 外部服務 | LLM API | 0 個 | ~$6.08 至 $9.77 |
