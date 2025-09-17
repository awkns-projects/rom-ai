# Corrected Action Logic V2 - Final Understanding

## ✅ **Correct Action Logic (User Clarified)**

### **Action Input Structure**
```javascript
// Action receives:
{
  record: {
    // The complete record of the target model
    id: "patient_123",
    name: "John Doe", 
    currentSymptoms: "headache, fever",
    medicalHistory: "diabetes, hypertension",
    // ... all other model fields
  },
  
  // External input fields (from other sources)
  externalData: {
    // Data from external APIs
    weatherData: { temperature: 75, humidity: 60 },
    // Data from other database models
    doctorInfo: { name: "Dr. Smith", specialty: "cardiology" },
    // User-provided parameters
    analysisType: "comprehensive",
    urgency: "high"
  }
}
```

### **Step Processing Logic**
Each step:
1. **Takes the record data** (target model record)
2. **Takes external input fields** (APIs, other models, parameters)
3. **Uses step type** (ai_generate_text, ai_generate_object, etc.) to process
4. **Generates output** based on step description and processing
5. **Output fields are saved directly to the record**

### **Example Corrected Step Flow**

#### **Step 1: AI Analysis**
```javascript
{
  type: 'ai_generate_object',
  description: 'Analyze patient symptoms with weather and doctor context',
  
  // Input: Record data + external data
  inputFields: [
    { name: 'currentSymptoms', source: 'model_field' },      // From record
    { name: 'medicalHistory', source: 'model_field' },       // From record  
    { name: 'weatherData', source: 'external_data' },        // From external API
    { name: 'doctorInfo', source: 'external_data' }          // From other model
  ],
  
  // Output: Fields to save to the record
  outputFields: [
    { name: 'diagnosisNotes', target: 'model_field' },       // Save to record.diagnosisNotes
    { name: 'riskScore', target: 'model_field' },            // Save to record.riskScore
    { name: 'recommendations', target: 'model_field' }       // Save to record.recommendations
  ],
  
  prompt: 'Analyze patient symptoms considering weather conditions and doctor specialty'
}
```

#### **Step 2: Generate Treatment Plan**
```javascript
{
  type: 'ai_generate_text',
  description: 'Generate detailed treatment plan based on analysis',
  
  // Input: Previous step results + record data
  inputFields: [
    { name: 'diagnosisNotes', source: 'previous_step' },     // From step 1 output
    { name: 'riskScore', source: 'previous_step' },          // From step 1 output
    { name: 'patientAge', source: 'model_field' },           // From record
    { name: 'urgency', source: 'external_data' }             // From user parameter
  ],
  
  // Output: Fields to save to the record
  outputFields: [
    { name: 'treatmentPlan', target: 'model_field' },        // Save to record.treatmentPlan
    { name: 'followUpDate', target: 'model_field' }          // Save to record.followUpDate
  ],
  
  prompt: 'Generate comprehensive treatment plan based on diagnosis and risk assessment'
}
```

## 🔧 **Required Implementation Fixes**

### **1. Update Input Field Sources**
```typescript
export type FieldSource = 
  | 'model_field'      // From the target model record
  | 'external_data'    // From external APIs, other models, user parameters
  | 'previous_step'    // From previous step output
  | 'system';          // System values (timestamps, etc.)
```

### **2. Update Field Access Code Generation**
```javascript
function generateFieldAccessCode(field: EnhancedStepField, stepNumber: number): string {
  switch (field.source) {
    case 'model_field': 
      return `input.record.${field.name}`;           // From the record
    case 'external_data': 
      return `input.externalData.${field.name}`;     // From external sources
    case 'previous_step': 
      return `step${stepNumber - 1}_results.${field.name}`;  // From previous step
    case 'system': 
      return field.name === 'currentDate' ? 'new Date()' : `systemValues.${field.name}`;
    default:
      return `input.${field.name}`;
  }
}
```

### **3. Update Step Code Generation**
```javascript
// Example AI generate object step:
const step1_results = await ai.generateObject({
  model: 'gpt-4',
  schema: z.object({
    diagnosisNotes: z.string(),
    riskScore: z.number(),
    recommendations: z.array(z.string())
  }),
  messages: [
    {
      role: 'system',
      content: 'Analyze patient symptoms considering weather and doctor context'
    },
    {
      role: 'user', 
      content: `
        Patient Symptoms: ${input.record.currentSymptoms}
        Medical History: ${input.record.medicalHistory}
        Weather Conditions: ${input.externalData.weatherData}
        Doctor Info: ${input.externalData.doctorInfo}
        Analysis Type: ${input.externalData.analysisType}
      `
    }
  ]
});

// Output fields are automatically saved to record at the end
```

### **4. Final Database Update**
```javascript
// At the end of action - save ALL output fields to the record
const modelFieldUpdates = {
  // From step 1
  diagnosisNotes: step1_results.diagnosisNotes,
  riskScore: step1_results.riskScore, 
  recommendations: step1_results.recommendations,
  
  // From step 2
  treatmentPlan: step2_results.treatmentPlan,
  followUpDate: step2_results.followUpDate,
  
  // From step 3 (timestamp)
  lastProcessed: step3_results.timestamp,
  status: step3_results.status
};

// CRITICAL: Save all output fields to the record
const updatedRecord = await db.patientRecord.update({
  where: { id: input.record.id },
  data: modelFieldUpdates
});
```

## 🎯 **Key Insights**

### **Record-Centric Processing**
- ✅ Action always has the **complete record** of the target model
- ✅ Steps can access **any field from the record** for processing
- ✅ External data **enriches** the processing context
- ✅ Output fields **update the record** with new information

### **External Data Sources**
- ✅ **External APIs**: Weather, medical databases, validation services
- ✅ **Other Models**: Related records, lookup data, reference information  
- ✅ **User Parameters**: Configuration, preferences, processing options
- ✅ **System Values**: Timestamps, user ID, system state

### **Processing Flow**
```
Record Data + External Data → AI Processing → Output Fields → Save to Record
```

This corrected understanding means actions are **record enhancement functions** that use the existing record data plus external context to generate new field values that get saved back to the record. 