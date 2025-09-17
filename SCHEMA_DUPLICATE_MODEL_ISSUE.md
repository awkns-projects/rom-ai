# Schema Duplicate Model Issue Analysis

## ❌ **The Problem: Duplicate Model Definitions**

The schema has **TWO definitions** of `MarketingCampaign`:

### **First Definition (Line 20-28):**
```prisma
model MarketingCampaign {
  id            String   @id @default(cuid())
  campaignName  String?
  startDate     DateTime?
  endDate       DateTime?
  budget        Float?
  status        String?           // ❌ String type
  contentIdeas  ContentIdea[]
  reports       MarketingReport[]
}
```

### **Second Definition (Line 36-44):**
```prisma
model MarketingCampaign {
  id            String   @id @default(cuid())
  campaignName  String?
  startDate     DateTime?
  endDate       DateTime?
  budget        Float?
  status        CampaignStatus?   // ✅ Enum type
  contentIdeas  ContentIdea[]
  reports       MarketingReport[]
}
```

## 🔍 **Why This Happens**

### **Root Cause: AI Generation Process**
1. **Initial Model Generation**: AI generates models with basic field types
2. **Enum Addition**: AI then adds enum definitions and updates models to use enums
3. **Duplicate Creation**: Instead of updating the existing model, AI creates a new one
4. **Result**: Two identical models with different field types

### **Common Scenarios:**
- Adding enum types to existing String fields
- Adding new fields to existing models
- Updating field types or constraints
- Adding relationships after initial generation

## 🔧 **Prevention Strategies**

### **1. Schema Deduplication Logic**
```javascript
function deduplicateModels(schema: string): string {
  const models = new Map();
  const lines = schema.split('\n');
  let result = [];
  let currentModel = null;
  let modelContent = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('model ')) {
      // Save previous model if exists
      if (currentModel && !models.has(currentModel)) {
        models.set(currentModel, modelContent.join('\n'));
      }
      
      // Start new model
      currentModel = line.match(/model\s+(\w+)/)?.[1];
      modelContent = [line];
    } else if (line.trim() === '}' && currentModel) {
      // End current model
      modelContent.push(line);
      if (!models.has(currentModel)) {
        models.set(currentModel, modelContent.join('\n'));
      }
      currentModel = null;
      modelContent = [];
    } else if (currentModel) {
      // Add to current model
      modelContent.push(line);
    } else {
      // Non-model content (generator, datasource, enums)
      result.push(line);
    }
  }
  
  // Add all unique models
  for (const modelSchema of models.values()) {
    result.push(modelSchema);
  }
  
  return result.join('\n');
}
```

### **2. AI Prompt Enhancement**
```javascript
const systemPrompt = `
🚨 CRITICAL: NEVER CREATE DUPLICATE MODELS

When updating models with enums or new fields:
1. ✅ UPDATE the existing model definition
2. ❌ NEVER create a second model with the same name
3. ✅ Merge enum fields into the existing model
4. ✅ Replace String fields with enum fields in the SAME model

CORRECT PATTERN:
model MarketingCampaign {
  id String @id @default(cuid())
  status CampaignStatus?  // ✅ Use enum directly in existing model
}

WRONG PATTERN:
model MarketingCampaign {
  status String?  // ❌ First definition
}
model MarketingCampaign {  // ❌ Duplicate model!
  status CampaignStatus?
}
`;
```

### **3. Schema Validation Enhancement**
```javascript
function validateNoDuplicateModels(schema: string): { valid: boolean; duplicates: string[] } {
  const modelNames = [];
  const duplicates = [];
  
  const modelMatches = schema.match(/model\s+(\w+)\s*{/g);
  if (modelMatches) {
    modelMatches.forEach(match => {
      const modelName = match.match(/model\s+(\w+)/)?.[1];
      if (modelName) {
        if (modelNames.includes(modelName)) {
          duplicates.push(modelName);
        } else {
          modelNames.push(modelName);
        }
      }
    });
  }
  
  return {
    valid: duplicates.length === 0,
    duplicates
  };
}
```

## ✅ **Fixed Schema**

The corrected schema should be:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ContentIdea {
  id               String   @id @default(cuid())
  title            String?
  description      String?
  createdDate      DateTime?
  relatedCampaignId String?
  trendScore       Float?
  relatedCampaign  MarketingCampaign? @relation(fields: [relatedCampaignId], references: [id])
}

model MarketingReport {
  id                String   @id @default(cuid())
  reportName        String?
  generatedDate     DateTime?
  campaignId        String?
  performanceMetrics Json?
  insightsSummary   String?
  campaign          MarketingCampaign? @relation(fields: [campaignId], references: [id])
}

enum CampaignStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}

model MarketingCampaign {
  id            String   @id @default(cuid())
  campaignName  String?
  startDate     DateTime?
  endDate       DateTime?
  budget        Float?
  status        CampaignStatus?   // ✅ Single model with enum field
  contentIdeas  ContentIdea[]
  reports       MarketingReport[]
}
```

## 🛡️ **Implementation Fix**

This duplicate model issue shows why we need:
1. **Schema deduplication logic** in the validation process
2. **Better AI prompts** that prevent duplicate model creation
3. **Validation checks** for duplicate model names
4. **Automatic merging** of duplicate models when detected

The error occurs because the AI generation process isn't properly coordinating model updates with enum additions, leading to duplicate model definitions instead of updating existing ones. 