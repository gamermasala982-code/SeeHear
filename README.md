# 🎧 SeeHear: The Unified Student Workspace

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://seehearfrontend.vercel.app/)
[![Hackathon](https://img.shields.io/badge/Hacktober-Hack_Days-orange.svg)](#)

**SeeHear** is a comprehensive, web-based digital learning workspace designed to streamline how students organize, interact with, and understand their study materials. Built by **Team Orangutan** for Hacktober Hack Days.

🌍 **Live Demo:** [seehearfrontend.vercel.app](https://seehearfrontend.vercel.app/)

---

## 📌 The Problem: App Juggling & Burnout
Studying complex material is hard enough, but today’s students also have to juggle too many apps just to get things done. A student might read a PDF in one tab, paste confusing text into an AI tool in another, use a third app to listen to the text aloud, and track their schedule somewhere else entirely. This constant switching breaks focus, causes burnout, and wastes valuable time.

## 🚀 Our Solution
SeeHear eliminates app-juggling by natively bringing together fast, secure document management, smart AI explanations, and a study planner into one simple, unified app. By putting all these study tools in one place, we reduce friction and help learners get into the zone, stay focused longer, and actually remember what they study.

---

## ✨ Core Features
*   **Document Library:** A beautifully organized hub to browse and instantly access study materials.
*   **Accessible Reading Interface:** A distraction-free reader with adjustable text size, spacing, line width, and language preferences.
*   **"Understand" Workspace:** A dedicated screen that breaks down difficult concepts into simple explanations alongside the original text.
*   **Ask Across Sources:** An advanced research tool that lets students ask questions and pulls answers directly from their selected materials.
*   **Listen Aloud (TTS):** Integrated Text-to-Speech that naturally reads documents aloud to assist with accessibility and multitasking.
*   **Study Planner:** A built-in task manager to help learners create goals and track daily progress.
*   **Accessibility Settings:** Global visual comfort options, including high-contrast mode and reduced interface motion.

---

## ☁️ Powered by Cloudinary & Gemini (Tech Stack)

### **Frontend & Architecture**
Built with **React**, **Vite**, and custom CSS grids, providing a lightning-fast Single Page Application (SPA). To keep the app secure and lightweight, we utilize **Vercel Serverless Functions** as a middleware API layer, ensuring sensitive keys never reach the browser. Task tracking and user preferences are handled instantly via the browser's **Local Storage**.

### **Media & Delivery: Cloudinary Integration**
Because SeeHear handles heavy academic documents, performance is everything. Cloudinary is the backbone of our media handling:
*   **Smart PDF Management:** We use Cloudinary to securely host and deliver heavy study materials, ensuring optimized delivery.
*   **Lightning-Fast CDN:** Cloudinary’s powerful global CDN ensures that study materials are compressed and delivered instantly, no matter what device or network the student is using.

### **The "Brain": Google Gemini AI**
*   **Generative AI:** Powers our "Understand" and "Ask Across Sources" features, providing instant, accurate contextual breakdowns of complex academic text.
*   **Text-to-Speech (TTS):** Utilizing Gemini's native audio generation (Flash-Lite TTS), we provide a highly natural, single-speaker (`Aoede`) reading experience without relying on robotic browser voices.

---

## 🛠️ Local Development & Setup

Want to spin up SeeHear on your own machine? Follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/gamermasala982-code/SeeHear.git](https://github.com/gamermasala982-code/SeeHear.git)
cd SeeHear

2. Install dependencies
npm install

3. Set up Environment Variables
Create a .env file in the root directory. You will need to add your own API credentials to enable AI and media features. (Do not share this file publicly!)
Code snippet
# Google Gemini TTS & AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts

4. Start the development server
npm run dev
