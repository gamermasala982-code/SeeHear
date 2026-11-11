import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🧹 Starting global UI text cleanup...");

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) { }
  });
  return filelist;
};

const allFiles = walkSync("src");

const replacements = [
  // 1. Global Badges & Labels
  [/<span className="brand-badge">.*?<\/span>/g, ""],
  [/Built-in Verified Sample/g, "Sample Document"],
  [/Hinglish \(Illustrative Demo\)/g, "Hinglish"],

  // 2. Home Dashboard
  [/with live AI intelligence\./g, "."],
  [/<span className="meta-tag">Active Session<\/span>/g, ""],
  [/<span className="meta-tag">\{documents\.length\} Available<\/span>/g, ""],
  [/<span className="meta-tag">\{completedTasks\}\/\{totalTasks\} Completed<\/span>/g, ""],
  [/Real-time Groq AI /g, "AI "],
  [/Multi-document RAG synthesis /g, "Multi-document synthesis "],

  // 3. Document Library
  [/Upload Document \(Server PDF Extraction \+ Cloudinary Storage\)/g, "Upload Document"],
  [/Upload PDFs for server-side text extraction and authenticated Cloudinary storage, or explore built-in multilingual study packs\./g, "Upload PDFs to read, understand, and query them."],
  [/Upload PDFs for server-side text extraction and instant AI understanding\./g, "Upload PDFs to read, understand, and query them."],
  [/Digital \.pdf files are parsed server-side via [^\s]+ and sent to [^\s]+ for authenticated Cloudinary storage \(max 10 MB\)\./g, "Supported files are processed automatically and added to your library."],
  [/PDFs are parsed server-side and made instantly readable and queriable\./g, "PDFs are processed securely and made instantly readable."],
  [/Upload & Extract via Server/g, "Upload Document"],
  [/Uploading & Extracting on Server\.\.\./g, "Uploading..."],
  [/Upload & Extract PDF/g, "Upload Document"],
  [/Extracting Pages on Server\.\.\./g, "Uploading..."],
  [/Server PDF Text Extraction Succeeded:/g, "Success:"],
  [/Server extracted digital text from/g, "Extracted text from"],
  [/Cloudinary Storage Verified:/g, "Storage Verified:"],
  [/Cloudinary Storage Status/g, "Storage Status"],
  [/Server PDF Extraction Failed/g, "Extraction Failed"],
  [/Server-Extracted PDF/g, "Extracted PDF"],
  [/Cloudinary Authenticated Asset/g, "Uploaded Document"],

  // 4. Understand Screen
  [/Understand — Live AI Explanations/g, "Understand"],
  [/Compare your original document passage with live, context-grounded Groq AI explanations/g, "Compare your document passage with AI explanations"],
  [/Compare your original document passage with live Groq Llama 3\.3 explanations/g, "Compare your document passage with AI explanations"],
  [/Compare your selected document passage with live, context-grounded Groq AI explanations/g, "Compare your selected document passage with AI explanations"],
  [/Compare your selected document passage with live, context-grounded Groq AI/g, "Compare your selected document passage with AI"],
  [/Groq Live Explanation/g, "AI Explanation"],
  [/Groq Llama 3\.3 Explanation/g, "AI Explanation"],
  [/Generating Live Groq AI Explanation\.\.\./g, "Generating AI Explanation..."],
  [/Generating Live Groq Explanation\.\.\./g, "Generating AI Explanation..."],
  [/Generating AI explanation via Groq Llama 3\.3\.\.\./g, "Generating AI explanation..."],
  [/Retry with Groq AI/g, "Retry"],
  [/<div className="notice-banner">\s*<span>\s*<strong>Live AI Engine Active:<\/strong>.*?<\/span>\s*<\/div>/g, ""],

  // 5. Ask Across Sources Screen
  [/Ask Across Sources — Live Groq RAG/g, "Ask Across Sources"],
  [/Ask any question across your uploaded PDFs and study documents with live Groq Llama 3\.3 synthesis and passage citations\./g, "Ask any question across your documents with verified passage citations."],
  [/Ask any question across your uploaded PDFs and study documents with live Groq synthesis and verified passage citations\./g, "Ask any question across your documents with verified passage citations."],
  [/Live Groq RAG Synthesis/g, "AI Synthesis"],
  [/Live Groq Llama 3\.3 Synthesis/g, "AI Synthesis"],
  [/Groq AI/g, "AI"],
  [/Groq RAG/g, "AI"],
  [/Analyzing selected documents with Groq Llama 3\.3 70B\.\.\./g, "Analyzing selected documents..."],
  [/Retrieving relevant passages and synthesizing answer with Groq\.\.\./g, "Retrieving relevant passages and synthesizing answer..."],
  [/<div className="notice-banner">\s*<span>\s*<strong>Live Groq RAG Synthesis:<\/strong>.*?<\/span>\s*<\/div>/g, ""],

  // 6. Reader Screen
  [/Translating passage into \{language\.toUpperCase\(\)\} via Groq Llama 3\.3\.\.\./g, "Translating passage into {language.toUpperCase()}..."],
  [/translate this passage live via Groq AI/g, "translate this passage live"],
];

let filesChanged = [];

allFiles.forEach(file => {
  if (!file.endsWith(".jsx") && !file.endsWith(".js") && !file.endsWith(".tsx")) return;
  let content = fs.readFileSync(file, "utf8");
  let original = content;
  
  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    filesChanged.push(file);
  }
});

console.log("✅ Cleaned UI text in the following files:");
filesChanged.forEach(f => console.log("  - " + f));

console.log("🔨 Running production build to verify UI markup integrity...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build passed successfully!");
} catch(err) {
  console.error("❌ Build failed");
}
