# JSON & YAML Usage in data-fmt

This document explains in detail how **data-fmt** processes JSON and YAML inputs, what it can automatically correct, and what limitations remain.

---

## JSON

### ✅ What happens
- Validates the input (must be valid JSON).
- Pretty-prints with 2 spaces indentation.
- Supports `jq` filters for transformation (`.`, `.foo`, `.bar[0]`, etc.).
- Output stays in JSON format.

### ❌ What it will not do
- It does not fix invalid JSON (missing commas, bad quotes, wrong brackets).
- It does not guess types if the JSON is malformed.

### Example
**Input**
```json
{"a":[1,2,3]}
```

**Output**
```json
{
  "a": [
    1,
    2,
    3
  ]
}
```

---

## YAML

### ✅ What happens
- Parses YAML into an object with `js-yaml`.
- Runs the parsed object through `jq` (internally JSON).
- Dumps back to YAML with consistent indentation and formatting.
- Cleans up messy-but-valid YAML (extra spaces, blank lines, uneven indentation inside items).
- Supports `jq` filters like `.usuarios[] | .nombre`.

### ❌ What it will not do
- Will not repair invalid YAML structure (e.g. keys at wrong hierarchy).
- Will not auto-convert YAML to JSON in the UI (keeps YAML output if YAML input).
- Does not support YAML advanced features beyond what `js-yaml` handles (anchors, aliases).

### Example 1 – valid but messy YAML
**Input**
```yaml
usuarios:

   - id: 1
     nombre:   Ana
     activo:  true


   -  id: 2
        nombre: Luis
     activo:   false
```

**Output**
```yaml
usuarios:
  - id: 1
    nombre: Ana
    activo: true
  - id: 2
    nombre: Luis
    activo: false
```

### Example 2 – unrecoverable YAML (invalid)
**Input**
```yaml
usuarios:
  - id: 2
  nombre: Luis
    activo: false
```

**Result**
```
Error: bad indentation of a mapping entry
```
Here `nombre` is at the same level as `usuarios`, not inside the list item, so the parser cannot recover.

---

## Automatic Fixes (Sanitizer)

When parsing YAML, the tool applies a sanitization step if the first parse fails. It can:
- Normalize line endings and tabs → spaces.
- Remove trailing spaces.
- Ensure space after `:`.
- Normalize list items (`-   foo` → `- foo`).
- Re-indent child keys under list items consistently.

**But:** it cannot reconstruct broken hierarchy.

---

## Summary

- Use **JSON** for strict structures.  
- Use **YAML** when human readability matters, but ensure correct indentation.  
- The tool helps clean up YAML formatting, but if indentation is structurally wrong, it will still error.

