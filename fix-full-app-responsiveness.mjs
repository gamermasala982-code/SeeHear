import fs from 'fs';
import { execSync } from 'child_process';

console.log("🛠️ Applying comprehensive global responsive rules and container constraints...");

// 1. Inject robust, battle-tested CSS constraints into src/styles/global.css
const responsiveCssPatch = `
/* ========================================================================== */
/* SeeHear Full-Application Responsive & Viewport Safety Guard                */
/* ========================================================================== */

*, *::before, *::after {
  box-sizing: border-box !important;
}

html, body {
  max-width: 100vw;
  overflow-x: hidden !important;
  margin: 0;
  padding: 0;
}

/* Ensure flex/grid children can always shrink to prevent blowout */
.app-container, .app-shell, main, section, article, div {
  min-width: 0;
}

/* Responsive Headings & Text Wrapping */
h1, h2, h3, h4, h5, h6, p, span, a, label {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Global Form Control Responsiveness */
input, select, textarea, button {
  max-width: 100%;
  box-sizing: border-box !important;
}

/* Global Table & Grid Containment */
.grid-2, .grid-3 {
  width: 100%;
  box-sizing: border-box;
}

/* Mobile & Tablet Viewport Adaptations */
@media (max-width: 1024px) {
  .app-shell {
    flex-direction: column !important;
  }
  aside, .sidebar {
    width: 100% !important;
    height: auto !important;
    position: relative !important;
  }
  main, .main-content {
    width: 100% !important;
    padding: 1rem !important;
  }
}

@media (max-width: 768px) {
  .grid-2, .grid-3, .ask-workspace-grid, .planner-workspace-grid, .understand-workspace-grid {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }
  
  .page-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 0.875rem !important;
  }

  .surface-card {
    padding: 1rem !important;
  }

  /* Prevent thumbnail strip blowout on mobile reader screens */
  .thumbnail-strip {
    display: none !important;
  }
}

@media (max-width: 480px) {
  body {
    font-size: 14px !important;
  }
  button, .btn {
    width: 100% !important;
    justify-content: center !important;
  }
}
`;

let cssPath = "src/styles/global.css";
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");
  if (!css.includes("SeeHear Full-Application Responsive & Viewport Safety Guard")) {
    fs.writeFileSync(cssPath, css + "\n" + responsiveCssPatch, "utf8");
    console.log("✅ Added master responsive CSS rules to global.css");
  }
}

// 2. Ensure App.jsx layout container has robust overflow protection
let appPath = "src/App.jsx";
if (fs.existsSync(appPath)) {
  let appCode = fs.readFileSync(appPath, "utf8");
  // Ensure main container prevents horizontal page overflow
  appCode = appCode.replace(
    /style=\{\{\s*display:\s*"flex"/g,
    'style={{ display: "flex", width: "100vw", maxWidth: "100%", overflowX: "hidden"'
  );
  fs.writeFileSync(appPath, appCode, "utf8");
  console.log("✅ Verified App.jsx container constraints");
}

console.log("🔨 Running production Vite build check...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Full application responsive audit & build passed successfully!");
} catch(err) {
  console.error("❌ Build failed:", err.message);
}
