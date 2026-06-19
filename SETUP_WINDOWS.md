# Share Mint - Windows Setup Guide

## Prerequisites (ek baar install karo)
1. **Node.js** — https://nodejs.org (LTS version download karo)
2. **Git** (optional) — https://git-scm.com

---

## Step 1 — Dependencies install karo

Root folder mein terminal kholo (Shift+Right Click → Open Terminal) aur ye run karo:

```
npm run install-all
```

Ye command backend, frontend, aur Electron — teeno ke dependencies install karega.

---

## Step 2 — React app build karo

```
npm run build-react
```

Ye `frontend/build/` folder banayega.

---

## Step 3 — App chalaao (development)

```
npm start
```

App khul jayegi! Backend automatically start hoga andar se.

---

## Step 4 — Windows Installer banao (optional)

```
npm run build-win
```

`dist/` folder mein `.exe` installer mil jayega jo kisi bhi Windows PC pe install ho sakta hai.

Portable version ke liye:
```
npm run build-portable
```

---

## Shortcut Keys

| Key | Action |
|-----|--------|
| F5 | Refresh |
| F11 | Full Screen |
| F12 | Developer Tools |
| Ctrl+= | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |

---

## Troubleshooting

**"Backend did not start" error:**
- Port 5000 kisi aur app ne use kar rakha hai — Task Manager mein check karo
- `backend/` folder mein `npm install` dobara chalaao

**Charts nahi dikh rahe:**
- Internet connection check karo
- F12 dabao → Console tab mein error dekho

**"npm not found":**
- Node.js install nahi hai — Step 1 ka link use karo

---

*⚠️ Disclaimer: Sirf educational purpose ke liye. Investment decisions ke liye SEBI registered advisor se consult karein.*
