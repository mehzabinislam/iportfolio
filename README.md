# 3D Miniature World Portfolio

An interactive 3D portfolio built around a floating island diorama, combining a miniature workspace, natural scenery, and an immersive browsing experience.

The project brings together 3D web graphics, animation, and an editorial-inspired interface to present personal information, projects, skills, and creative work.

## Live Website

**[Visit the Portfolio](https://iportfolio-orcin.vercel.app/)**


## Features

- **Interactive 3D Environment:** A floating island with detailed miniature scenery and a personal workspace.
- **Immersive Navigation:** Animated camera transitions between different sections of the portfolio.
- **Interactive Workspace:** A miniature studio featuring creative and workstation elements.
- **Personal Portfolio Sections:** Dedicated sections for projects, experience, education, skills, and contact information.
- **Art Gallery:** A collection of traditional and digital creative work.
- **Responsive Interface:** Layout and navigation designed for different screen sizes.
- **Performance Options:** Features intended to make the 3D experience more manageable on different devices.

## Technology Stack

- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **3D Graphics:** Three.js, React Three Fiber, React Three Drei
- **Animation:** GSAP, Framer Motion
- **Styling:** Tailwind CSS 4
- **Smooth Scrolling:** Lenis
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Navigate to the project directory:

   ```bash
   cd IslandPortfolio
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal, usually:

   `http://localhost:5173`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Type-checks and builds the production application |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs Oxlint |

## Project Customization

Portfolio content is centralized in:

`src/data/portfolio.ts`

You can update personal information, biography, projects, skills, experience, education, gallery entries, and contact details from this file.

The 3D environment and interface components can be customized through their respective source files in `src/`.

## Deployment

This project is deployed using Vercel.

Updates pushed to the connected GitHub branch can trigger automatic deployments.

## Acknowledgements

Built using the React, Three.js, and Vite ecosystem.

