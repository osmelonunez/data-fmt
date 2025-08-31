# data-fmt · Data Formatter

[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue.svg)](./LICENSE)
[![Status: Stable](https://img.shields.io/badge/status-Stable-brightgreen.svg)](./)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/osmelonunez/data-fmt)
![Repo size](https://img.shields.io/github/repo-size/osmelonunez/data-fmt)

UI for formatting and transforming structured data (**JSON, YAML**) using **jq** and `js-yaml`.  
Everything runs inside **Docker**, so you don’t need to install Node or jq on your machine.

![Preview](./docs/screenshot-01.png)
![Preview](./docs/screenshot-02.png)
![Preview](./docs/screenshot-03.png)

---

## Stack

- Docker image based on `node:24-alpine` with [`jq`](https://github.com/jqlang/jq) included  
- Express backend with support for **JSON** and **YAML** (via [`js-yaml`](https://github.com/nodeca/js-yaml))  
- Static UI served from `public/`  
- Exposed port: **8080**

---

## Requirements

- Docker and Docker Compose

---

## How to run

Use the `Makefile` at the root of the project.

### Clean build
```bash
make build
```

### Start using an already built image
```bash
make up
# Open http://localhost:8080
```

### Stop
```bash
make down
```

### Run backend tests
```bash
cd backend
npm test
```
The test suite uses Node's built-in `node:test` runner.
It currently verifies:

- Normalization of spaces and tabs
- Consistent list formatting
- Proper indentation for list children

---

## Features

- ✅ Format and transform **JSON** with jq  
- ✅ Format and transform **YAML** with js-yaml + jq  
- ✅ Copy, download, or upload data files
- ✅ Share formatted results via URL (links expire after 24 h)
- ✅ Modern, responsive UI
- 🔒 Your data is processed inside a local container  

---

## Usage

1. Paste or upload your JSON or YAML  
2. Copy or download the output  

👉 For details about JSON/YAML support and limitations, see [docs/usage-json-yaml.md](./docs/usage-json-yaml.md).

---

## License

This project is licensed under the **GNU General Public License v3.0**.  
You are free to use, modify, and distribute it, but any distribution must remain under the same GPLv3 license.  

See the full text in [LICENSE](./LICENSE).

---
