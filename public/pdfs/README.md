# PDFs

Drop study PDFs into this folder. The site will serve them at `/ca-inter/pdfs/<filename>.pdf`.

Reference them from the Sheet's Syllabus tab `PDF URL` column with a bare path:

```
pdfs/material-cost.pdf
```

(no leading slash, no domain — `src/lib/pdf.ts` resolves the full URL.)

## Naming convention

- All lowercase
- Hyphen-separated (no spaces)
- Keep names short and meaningful: `process-costing.pdf`, `audit-evidence.pdf`

The filename (without `.pdf`) is the storage key for the cross-device resume feature.
