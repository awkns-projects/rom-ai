# V model

```
    Requirements
         |
   System Design
         |
   Architecture Design
         |
   Module Design
         |
     Coding
         |
    Unit Testing  <-- Module Design
         |
Integration Testing <-- Architecture Design
         |
System Testing <-- System Design
         |
Acceptance Testing <-- Requirements
```

### 左邊：開發階段（Verification）
**需求分析（Requirements Analysis）**  
蒐集用戶需求。

**系統設計（System Design）**  
整體架構設計。

**架構/高階設計（Architecture Design）**  
模組之間的互動設計。

**模組/詳細設計（Module Design）**  
各個元件的詳細邏輯。

**程式撰寫（Coding）**  
撰寫實際程式碼。

### 右邊：測試階段（Validation）
**單元測試（Unit Testing）**  
測試各個模組是否正確。

**整合測試（Integration Testing）**  
測試模組之間的整合與互動。

**系統測試（System Testing）**  
測試整個系統功能是否符合設計。

**驗收測試（Acceptance Testing）**  
測試是否符合用戶需求。


# V model with TDD in AI development

1. 需求分析  
2. 撰寫驗收測試  
3. 根據驗收測試，做系統設計  
3. 撰寫系統測試  
4. 根據系統測試，做架構設計  
5. 撰寫整合測試  
6. 根據整合測試，做模組設計  
7. 撰寫單元測試  
8. 程式撰寫  
9. 單元測試  
10. 整合測試  
11. 系統測試  
12. 驗收測試  


# Example
**App 敘述**：Create an app that connects to Shopify API to track inventory levels, automatically updates Google Sheets with low-stock alerts, and sends Gmail notifications when items need restocking.

## 1. 需求分析（Requirements Analysis）:
```
- 作為店主，我希望定時自動檢查 Shopify 的庫存數據。
- 當商品庫存低於設定門檻時，我希望收到 Gmail 通知提醒補貨。
- 我希望將低庫存清單儲存在 Google Sheets 中，便於追蹤。
```

## 2. 撰寫驗收測試（Acceptance Tests）
使用 Gherkin 語法撰寫：
```
Feature: Inventory Alert App

  Scenario: 商品庫存低於門檻時，發出警示
    Given 我有一個已連接的 Shopify 店面
    And 有商品 A 庫存為 2，門檻為 5
    When App 啟動並檢查庫存
    Then App 應該發送一封 Gmail 給庫存管理員
    And App 應該更新 Google Sheets，記錄商品 A 的狀況

  Scenario: 所有商品庫存皆正常
    Given 我有一個 Shopify 店面
    And 所有商品庫存都大於 5
    When App 啟動
    Then 不應該發送任何 Gmail
    And Google Sheets 不應有變化
```

## 3. 根據驗收測試進行系統設計（System Design）

📦 模組設計  
- ShopifyService: 抓取商品庫存  
- InventoryChecker: 比對門檻並產生 alert  
- GoogleSheetsService: 更新低庫存清單  
- GmailService: 寄送通知  
- Scheduler: 定時執行（例如每日）

📐 資料流圖（簡略）
```
[Scheduler]
     |
     v
[ShopifyService] ---> 商品清單 + 庫存數量
     |
     v
[InventoryChecker] ---> 找出低於門檻商品
     |
     v
[GoogleSheetsService] + [GmailService]
```

## 4. 撰寫系統測試（System Tests）
```
def test_inventory_alert_end_to_end():
    inventory = fetch_inventory_from_shopify()
    low_stock_items = filter_low_stock(inventory)
    assert send_gmail(low_stock_items)
    assert update_google_sheets(low_stock_items)
```

## 5. 根據系統測試設計架構（Architecture Design）
```
選用 Python + Google APIs + Shopify REST API  
使用 環境變數 / Secret Manager 儲存 API 金鑰  
建議部署成 AWS Lambda / GCP Cloud Function
```

## 6. 撰寫整合測試（Integration Tests）
```
def test_shopify_fetch():
    inventory = shopify_service.fetch_inventory()
    assert isinstance(inventory, list)
    assert 'title' in inventory[0]

def test_low_stock_filtering():
    inventory = [{'title': 'Item A', 'quantity': 2}]
    low_stock = inventory_checker.check(inventory, 5)
    assert low_stock == [{'title': 'Item A', 'quantity': 2}]
```

## 7. Module Design
```
class ShopifyService:
    def fetch_inventory(self) -> List[Dict]: ...

class InventoryChecker:
    def check(items: List[Dict], threshold: int) -> List[Dict]: ...

class GoogleSheetsService:
    def append_rows(rows: List[Dict]): ...

class GmailService:
    def send_alert(items: List[Dict]): ...
```

## 8. Unit Tests
```
def test_inventory_checker_detects_low_stock():
    data = [{"title": "A", "quantity": 2}, {"title": "B", "quantity": 10}]
    result = check_inventory(data, threshold=5)
    assert result == [{"title": "A", "quantity": 2}]
```

## 9. Code Implementation (Simplified)
```
def check_inventory(items, threshold):
    return [item for item in items if item['quantity'] < threshold]

def main():
    inventory = shopify_service.fetch_inventory()
    low_stock_items = check_inventory(inventory, 5)
    if low_stock_items:
        google_sheets_service.append_rows(low_stock_items)
        gmail_service.send_alert(low_stock_items)
```

## 10–12. Test Execution

| Test Type         | Status           | Tool                     |
|------------------|------------------|--------------------------|
| Unit Tests        | ✅ Implemented   | pytest                   |
| Integration Tests | ✅ Implemented   | pytest                   |
| System Tests      | ✅ Implemented   | pytest                   |
| Acceptance Tests  | ✅ Defined       | Behave (Gherkin) or manual |