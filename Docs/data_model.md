# DATA_MODEL.md

## Entidades

### AnalysisRun
- id
- status
- created_at

### InputDocument
- id
- analysis_run_id
- tipo
- original_filename
- file_path
- file_hash

### DocumentPage
- id
- document_id
- page_number

### ExtractedField
- id
- field_name
- raw_value
- normalized_value
- bbox

### Issue
- id
- type
- severity
- description

### IssueEvidence
- issue_id
- field_id
- page
- bbox

### ReviewDecision
- issue_id
- decision
- comment

---

## Regra
não armazenar dados sensíveis desnecessários
