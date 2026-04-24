You are a senior full-stack engineer and award-winning product designer.

Build a production-ready wedding guest media upload platform with the following exact requirements:

🎨 DESIGN (CRITICAL)
- Theme: cozy, romantic, intimate wedding atmosphere
- Visual inspiration:
  - green wooden forest house
  - warm yellow fairy lights
  - soft watercolor textures
  - natural greenery and soft sunlight
- The design MUST NOT look AI-generated
- Avoid generic UI kits and SaaS dashboards
- Make it feel like a premium wedding invitation

- Colors:
  - warm ivory background (#f5f1e8)
  - soft green (#6b8f71)
  - warm golden light accents
- Typography:
  - Elegant serif (headings)
  - Minimal sans-serif (body)
- Add:
  - soft glowing lights
  - subtle grain/paper texture
  - very light animations (fade, float)

📱 USER FLOW (VERY SIMPLE)
- User scans QR code → lands directly on upload page
- NO LOGIN, NO AUTH

Page includes:
- Title: "Gizem & Berkay"
- Subtitle: "Bizimle bu anıları paylaş ❤️"
- Optional input: name
- Optional textarea: message
- File upload area:
  - drag & drop
  - mobile file picker
  - multiple file selection
  - preview thumbnails
  - upload progress bar

📂 UPLOAD REQUIREMENTS
- Accept:
  - images
  - videos
- Keep ORIGINAL QUALITY (NO compression)
- No artificial limit from UI
- Use Supabase Storage
- Support large files (handle gracefully)

🧠 BACKEND (SUPABASE)
- Table: uploads
  fields:
    - id (uuid)
    - name (text, nullable)
    - note (text, nullable)
    - file_url (text)
    - created_at (timestamp)

- Storage bucket:
  - private bucket (NOT public)

🔐 ADMIN ACCESS (IMPORTANT)
- Create hidden route:
  /admin

- Show password screen:
  password: "gizobekoevlendi"

- If correct:
  - list all uploaded files
  - show:
    - name
    - note
    - date
    - preview (image/video)

- Allow:
  - download each file in ORIGINAL QUALITY
  - bulk download button (zip all files)

- If password wrong:
  - show minimal error (no hint)

⚠️ SECURITY NOTE
- This is a simple protection, not real authentication
- Do not expose Supabase keys publicly

☁️ DEPLOYMENT
- Use Vercel
- Environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

⚙️ TECH STACK
- Next.js (App Router)
- TypeScript
- Tailwind CSS (customized design)
- Supabase JS client

✨ UX DETAILS
- After upload:
  - show warm thank you message:
    "Bu güzel anı için teşekkür ederiz ❤️"
- Add subtle animation (fade in/out)
- Keep everything FAST and minimal

📦 OUTPUT REQUIRED
- Full project structure
- All pages and components
- Supabase setup step-by-step
- Vercel deployment steps
- .env example

🎯 GOAL
Make this feel like a real emotional wedding experience,
NOT a tech product.