# Data Import Demo

## Purpose

This prototype demonstrates a simple data import and review flow for non-technical users.

---

### Installation & Run

```bash
npm install

npm run dev
```

Then open:
```
http://localhost:5173
```

### Demo CSV

Although the schema is editable through the schema builder section, by default the prototype expects a simple CSV with two columns: `name` and `age`.

```
name,age
John,30
Doe,25
```

---

## Overview & Approach

The flow is structured into two main steps: 

- define the schema
<img width="1005" height="562" alt="image" src="https://github.com/user-attachments/assets/1e71a73b-a728-4a3c-960d-0dfe1565a7a3" />

- validate and submit the data
<img width="1021" height="560" alt="image" src="https://github.com/user-attachments/assets/18df4d54-9359-4056-a3c5-d39dc656ecca" />


---

## Architecture & Data Flow

The main state lives in a React context (`ImportProvider`) which manages the schema, imported rows, and all data manipulation actions (edit cell, delete row, reset). Validation is handled outside the UI, with logic separated into row-level (`validateRow`) and dataset-level (`validateRows`) checks.

When a CSV is uploaded:
1. It is parsed using `papaparse`.
2. Each row is mapped to the current schema.
3. Validation runs.

Inline editing updates the state and triggers validation only for the changed row wherever possible, keeping the UI responsive in most cases. Rows can also be deleted individually, which automatically updates validation results for remaining rows.

---

## UX Decisions

The UX is designed to give users clear control over their data while without overwhelming them:

- **Schema builder**: Users define columns, types, and validation rules (required, unique, regex). They can also provide custom error messages to make validation feedback specific. In this demo the schema building is on the same page as the data uploader, but ideally it could be split into separate areas for different users.

- **Data review & summary**: Users can see a quick summary showing the total number of columns, valid rows count and how many rows contain errors. This gives a high-level view of data quality before diving into details. They can toggle a filter to hide valid rows and focus only on rows with errors. While editing, rows remain visible even when filtered, preventing confusion.

- **Inline editing & deletion**: Errors are displayed directly under the affected field for clear guidance. Users can also delete rows they no longer need, which updates the summary and validation. Changes trigger immediate validation on that row. 

---

## Trade-offs & Next Steps

The prototype intentionally simplifies several things:

- No backend integration
- No advanced table features (sorting, searching, virtualization)
- Validation for uniqueness is not optimized and could become slow for large datasets
- No testing

I've decided to bring focus on the configuration side of the schema, imagining a 2-sided flow where a user is responsible to define the import schema via UI, and another user is responsible of actually uploading and fixing the data.

Next steps for improvement include:

- **UX**: Navigation to the next error would allow users to quickly move through problematic rows; a visual regex editor would simplify schema creation; each section (schema, data table) could be made expandable only when in action to avoid overwhelming the user; when show only errors is enabled, preserve the original row numbers.
- **Performance**: Precompute unique keys or offload dataset-wide validation to a worker thread.
- **Components**: I decided to use a central React context because it allows all parts of the import flow to access and update shared state easily without prop drilling. This made coordinating validation and inline edits straightforward and kept the prototype simple and lightweight. The trade off is that components are less independent, quite large and harder to test in isolation since they rely on the context. 
