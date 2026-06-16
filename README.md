# BigQuery Release Explorer

BigQuery Release Explorer is a premium, lightweight web application built with **Python Flask** and **Vanilla HTML/CSS/JS** that fetches and parses the official BigQuery Release Notes feed. It presents them in an interactive, gorgeous dark-mode timeline where users can search, filter updates by category, and easily draft and post updates directly to Twitter (X) with one click.

---

## Features

- 🔄 **Real-Time Integration**: Direct retrieval and extraction from the Google Cloud BigQuery RSS/Atom release feed.
- 🎨 **Modern Interface**: Premium glassmorphic cards, HSL-tailored colors, visual highlights, and interactive micro-animations.
- 🔍 **Instant Search & Filter**: Search through descriptions or filter cards dynamically by categories like *Features*, *Issues*, and *Deprecations*.
- 🐦 **Interactive Tweet Composer**: Select any update card to automatically draft a tweet with a post preview simulator. Features an automatic 280-character limit truncate and a circular progress ring.
- ⚡ **Manual Refresh**: Instantly pull updates at any time with a dedicated refresh button and a spinner loader.

---

## File Structure

```
├── app.py                 # Flask server & XML parsing engine
├── requirements.txt       # Python dependencies
├── .gitignore             # Git exclusion rules
├── templates/
│   └── index.html         # Main page layout & structures
└── static/
    ├── css/
    │   └── styles.css     # Dark mode CSS variables & styling
    └── js/
        └── app.js         # Core AJAX client-side routing & composing
```

---

## Installation & Setup

Ensure you have Python 3.10+ installed on your system.

### 1. Clone or Open the Directory
Navigate to the root directory of the project:
```bash
cd /Users/anusornchaikaew/Work/private/AIAgents/agy-cli-projects
```

### 2. Create a Virtual Environment
```bash
python3 -m venv venv
```

### 3. Activate the Environment
- On macOS/Linux:
  ```bash
  source venv/bin/activate
  ```
- On Windows (Command Prompt):
  ```cmd
  venv\Scripts\activate.bat
  ```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Run the Server
```bash
python app.py
```

The application will be served at **http://127.0.0.1:5001**. Open this URL in your web browser.

---

## Usage

1. **Browse updates**: Timeline cards are organized by date headers.
2. **Filter & Search**: Use the search input box or click tags (e.g., *Features*, *Issues*) to filter the timeline instantly.
3. **Draft a Tweet**: Click on any timeline card or its Twitter icon. This action populates the mock post card with a pre-configured text update and link.
4. **Post on X**: Click the **Post on X** button in the composer to open Twitter's official web composer with your pre-filled text.
5. **Refresh**: Press **Refresh** at the top right to check for the latest release notes.
