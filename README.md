# 3D Miniature World Portfolio

An interactive 3D portfolio built around a floating island diorama, combining a miniature workspace, natural scenery, and an immersive browsing experience.

The project brings together real-time 3D graphics, animation, and an editorial-inspired interface to showcase personal information, projects, experience, skills, and creative work.

## Live Website

**[Explore the 3D Portfolio](https://mehzabinislam.github.io/iportfolio/)**

## Overview

Visitors can explore different portfolio sections through animated camera transitions and interact with the environment.


## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| 3D Graphics | Three.js, React Three Fiber, React Three Drei |
| Animation | GSAP, Framer Motion |
| Styling | Tailwind CSS 4 |
| Smooth Scrolling | Lenis |
| Icons | Lucide React |

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/mehzabinislam/iportfolio.git
```

**2. Navigate to the project directory**

```bash
cd iportfolio
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the local URL**

Visit the address displayed in your terminal, usually:

`http://localhost:5173`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Type-checks and builds the production application |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs Oxlint |

## Project Customization

Most portfolio content is centralized in:

`src/data/portfolio.ts`

You can use this file to update:

- Personal information and biography
- Projects and achievements
- Experience and education
- Skills and other portfolio details
- Gallery entries and artwork
- Contact information

The 3D environment, camera behavior, animations, and interface can be customized through their respective components and source files inside `src/`.

## Deployment

The portfolio is hosted on **GitHub Pages**.

Deployment is automated through GitHub Actions. When changes are pushed to the `main` branch, the workflow builds the application and publishes the production files to GitHub Pages.

You can view the deployment workflow here:

[GitHub Actions — Deployment](https://github.com/mehzabinislam/iportfolio/actions)

## Acknowledgements

Built with the React, Three.js, and Vite ecosystem.

---

**Repository:** [github.com/mehzabinislam/iportfolio](https://github.com/mehzabinislam/iportfolio)

**Live Portfolio:** [mehzabinislam.github.io/iportfolio](https://mehzabinislam.github.io/iportfolio/)
