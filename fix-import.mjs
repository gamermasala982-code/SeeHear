import fs from 'fs';

let code = fs.readFileSync('src/components/HomeDashboard.jsx', 'utf8');

// Safely add the missing CheckCircle2 import if it is not already there
if (!code.includes('CheckCircle2')) {
  code = code.replace(
    /FolderOpen\s*\}\s*from\s*"lucide-react";/g,
    'FolderOpen,\n  CheckCircle2\n} from "lucide-react";'
  );
  fs.writeFileSync('src/components/HomeDashboard.jsx', code, 'utf8');
  console.log('✅ Missing CheckCircle2 import fixed!');
} else {
  console.log('✅ Import already exists.');
}
