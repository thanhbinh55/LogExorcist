# The Log Exorcist 

A cyberpunk-themed AI-powered log analysis and debugging tool built with Next.js 14, Tailwind CSS, and the Vercel AI SDK.

## Features

- **AI-Powered Analysis**: Sherlock Holmes-style log analysis with root cause detection
- **Real-time Streaming**: Watch the AI analyze your logs in real-time
- **Cyberpunk UI**: Dark mode theme with neon purple accents and monospaced fonts
- **Markdown Support**: Beautifully rendered markdown with syntax highlighting
- **History**: Save and revisit your recent analyses
- **Split-Screen Layout**: Clean interface for input and output

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/thanhbinh55/CursorHackathon.git
cd CursorHackathon
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

4. Add your Google Gemini API key to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste your error logs into the left textarea
2. Click "Exorcise Log" to analyze
3. Watch the AI detective analyze your logs in real-time
4. Review the structured analysis with:
   - Root cause identification
   - Evidence from the logs
   - Three solution options (Quick Fix, Robust Fix, Dirty Hack)
   - Severity score (1-10)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** with custom cyberpunk theme
- **Vercel AI SDK** for streaming responses
- **Google Gemini 1.5 Flash** for log analysis
- **React Markdown** for rendering analysis
- **React Syntax Highlighter** for code blocks
- **Lucide React** for icons

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route for Google Gemini streaming
│   ├── globals.css                # Global styles with cyberpunk theme
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main application page
├── .env.local.example             # Example environment variables
├── package.json                   # Dependencies
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                  # TypeScript configuration
```

## Customization

### Theme Colors

Edit `tailwind.config.ts` to customize the color scheme:
- `neon-purple`: Primary accent color
- `neon-green`: Secondary accent color
- `dark-bg`: Background color
- `dark-surface`: Surface/card color

### AI Persona

Modify the `SYSTEM_PROMPT` in `app/api/chat/route.ts` to change the AI's analysis style and output format.

## License

MIT
