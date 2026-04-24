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

### TextSpan
- id
- document_page_id
- text
- bbox
- bbox pode ser null

### ExtractedField
- id
- input_document_id
- document_page_id
- field_name
- raw_value
- normalized_value
- bbox
- bbox pode ser null

### Issue
- id
- analysis_run_id
- type
- severity
- description

### IssueEvidence
- issue_id
- field_id
- page
- bbox
- bbox pode ser null

### ReviewDecision
- issue_id
- decision
- comment

---

## Regra
não armazenar dados sensíveis desnecessários
