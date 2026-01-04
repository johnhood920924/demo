# Piano Roll MIDI Visualizer

A React web application for visualizing and playing MIDI files in a piano roll format. Upload MIDI files, view them in an interactive piano roll interface, and play them back with audio.

## Features

- 🎹 **Piano Roll Visualization**: Visual representation of MIDI notes with velocity-based coloring
- 🎵 **MIDI File Upload**: Upload and store MIDI files via Supabase
- ▶️ **Playback Controls**: Play, pause, stop, seek, and adjust playback rate (0.25x to 2.0x)
- 🎹 **Interactive Piano Keyboard**: Full 88-key keyboard (A0 to C8) with click-to-play functionality
- 💾 **File Management**: View, load, and delete previously uploaded MIDI files
- 📊 **Auto-scrolling Canvas**: Piano roll automatically scrolls to keep playback indicator visible
- ☁️ **Cloud Storage**: Files stored in Supabase (free tier supported)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works) - optional for local testing

## Installation

1. **Clone or navigate to the project directory:**
```bash
cd demo-frontend
```

2. **Install dependencies:**
```bash
npm install
```

## Setup

### Option 1: Local Development (Without Supabase)

You can run the app locally without Supabase, but file storage and retrieval won't work:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Note**: Without Supabase, you can upload and play MIDI files, but they won't be saved or retrievable after page refresh.

### Option 2: Full Setup (With Supabase)

For full functionality including file storage and retrieval:

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to finish setting up

2. **Set up the database:**
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL from `supabase-setup.sql` file (located in this directory)
   - This creates the `midi_files` table and necessary policies

3. **Create a storage bucket:**
   - Go to Storage in your Supabase dashboard
   - Click "New bucket"
   - Name it `midi-files`
   - Make it **public** (or configure RLS policies manually)
   - The SQL file also includes storage policies

4. **Get your Supabase credentials:**
   - Go to Project Settings > API
   - Copy your **Project URL** (under "Project URL")
   - Copy your **anon/public key** (under "Project API keys" > "anon public")

5. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

6. **Add your Supabase credentials to `.env`:**
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

7. **Run the development server:**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Usage

1. **Upload a MIDI file:**
   - Click the "Upload MIDI" button in the header
   - Select a `.mid` file from your computer
   - The file will be parsed and displayed in the piano roll

2. **Playback controls:**
   - Click the play button (▶) to start playback
   - Click pause (⏸) to pause playback
   - Click stop (⏹) to stop and reset to beginning
   - Use the progress bar to seek to any position
   - Adjust playback speed using the +/- buttons (0.25x to 2.0x)

3. **Piano keyboard:**
   - Click any key on the piano keyboard to play that note
   - Keys will highlight during MIDI playback
   - Clicked keys will briefly highlight when played

4. **File management (with Supabase):**
   - Previously uploaded files appear in the sidebar
   - Click a file name to load it
   - Click the × button to delete a file

5. **Piano roll interaction:**
   - The canvas automatically scrolls to follow the playback indicator
   - Notes are color-coded based on velocity (darker = higher velocity)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build locally:
```bash
npm run preview
```

## Deployment to Vercel

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Import your repository in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure environment variables:**
   - In Vercel project settings, go to "Environment Variables"
   - Add the following:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

The app will be live at your Vercel URL!

## Project Structure

```
demo-frontend/
├── src/
│   ├── components/
│   │   ├── PianoRoll.jsx      # Piano roll visualization component
│   │   ├── PianoKeyboard.jsx  # Interactive keyboard component
│   │   └── PlaybackControls.jsx # Playback UI controls
│   ├── lib/
│   │   └── supabase.js        # Supabase client configuration
│   ├── App.jsx                # Main application component
│   ├── App.css                # Application styles
│   ├── index.css              # Global styles
│   └── main.jsx               # Application entry point
├── public/                    # Static assets
├── supabase-setup.sql         # SQL setup script for Supabase
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── README.md                  # This file
```

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tone.js** - Audio synthesis and playback
- **@tonejs/midi** - MIDI file parsing
- **Supabase** - Backend storage and database
- **Canvas API** - Piano roll visualization

## Troubleshooting

### Canvas not showing
- Check the browser console for parsing errors
- Ensure the MIDI file is valid and contains tracks with notes
- Some MIDI files may have no tracks - check console logs

### Audio not playing
- Make sure you've clicked somewhere on the page first (browser autoplay policy)
- Check browser console for audio context errors
- Try refreshing the page

### File upload/delete not working
- Verify Supabase is configured (check `.env` file)
- Ensure you've run the SQL setup script
- Check browser console for Supabase API errors
- Verify storage bucket exists and is public

### Build errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (requires 18+)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

## License

This project is provided as-is for educational/demonstration purposes.

## Support

For issues or questions, please check the browser console for error messages and debug logs.

# demo-frontend
