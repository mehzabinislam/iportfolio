
import type { PortfolioData } from '../types/portfolio';

export const portfolioData: PortfolioData = {
  personal: {
    name: "Mehzabin Islam Doua",
    title: "STEM & Tech Enthusiast | Web Dev | Exploring Python, AI, Mathematics & Research | Building Innex.ED | GFX/UI Designer & Artist",
    tagline: "Curiosity has a way of turning into something interesting.",
    subheadline: "Exploring mathematics, technology, research, and the little things that make the world work. Somewhere between solving problems, experimenting with code, creating art, there's always something new to learn.",
    status: "Enthusiast | learning & exploring new cool things!",
    location: "Dhaka, Bangladesh",
    timezone: "Bangladesh Standard Time (UTC+6)",
    bio: [
      "I'm Mehzabin, a high school student interested in pretty much everything that makes you stop and wonder how something works. Mathematics, AI, technology, scientific research, and creative problem-solving are some of my favourite rabbit holes. I enjoy experimenting with Python, exploring web development, working with data, and learning how different ideas connect.",
      "Outside the technical side of things, I'm also into graphic design, UI/UX, digital art, writing, and creating things that people can actually use. I enjoy mentoring students, working with youth communities, and finding ways to make learning more accessible."
    ],
    philosophy: "A bit about me here",
    interests: [
      "Mathematics & Problem Solving",
      "Artificial Intelligence & Machine Learning",
      "Scientific Research & Data Analysis",
      "Education, Learning & Community Building",
      "Digital Art, GFX & UI/UX Design"
    ],
    readingList: [
      { title: "Hands-On Machine Learning with Scikit-Learn and PyTorch: Concepts, Tools, and Techniques to Build Intelligent Systems", author: " Geron Aurelien" },
    ]
  },

  contact: {
    email: "atiya473939@gmail.com",
    github: "https://github.com/mehzabinislam",
    linkedin: "https://www.linkedin.com/in/mehzabin-islam-doua-8964a6420/",
    instagram: "https://www.instagram.com/mawy_o_0/?utm_source=ig_web_button_share_sheet",
    availability: "Open to meaningful collaborations and interesting opportunities",
    note: "Have an interesting idea, a project, or something worth discussing? I'd love to hear about it. Always happy to connect over STEM, education, research, technology, or creative work."
  },

  
  projects: [

    // ───────────── ACHIEVEMENTS ─────────────

    {
      id: "queens-commonwealth-2026",
      title: "Queen's Commonwealth Writing Competition",
      category: "Achievement",
      description: "Received a Silver Award in the 2026 Queen's Commonwealth Writing Competition.",
      longDescription: "An international writing competition bringing together entries from across the Commonwealth.",
      technologies: [],
      metrics: "Silver Award · 2026",
      year: "2026",
      accentColor: "#613F4D"
    },
    {
      id: "purple-comet-2026",
      title: "Purple Comet! Math Meet",
      category: "Achievement",
      description: "Competed in the 2026 international mathematics competition, scoring 25 out of 30.",
      longDescription: "Placed 5th in Bangladesh and 135th globally among 506 participating teams.",
      technologies: [],
      metrics: "5th Bangladesh · 135th Global · 25/30",
      year: "2026",
      accentColor: "#8B9E87"
    },
    {
      id: "infinity-ai-buildfest-2026",
      title: "Infinity AI BuildFest",
      category: "Achievement",
      description: "Selected as a finalist with Team DengueEye for an AI-based dengue risk monitoring and prediction project.",
      longDescription: "The competition brought together 612 teams and 3,360 participants, with 207 teams reaching the finalist stage.",
      technologies: [],
      metrics: "Finalist · 207 finalist teams",
      year: "2026",
      accentColor: "#C99B9B"
    },
    {
      id: "igem-biohackathon-2026",
      title: "iGEM Startups BioHackathon",
      category: "Achievement",
      description: "Reached the finalist stage of the 2026 BioHackathon.",
      longDescription: "Placed among the top 9% of participating teams, with a position of 30th among 330 teams.",
      technologies: [],
      metrics: "Finalist · Top 9% · 30/330",
      year: "2026",
      accentColor: "#8B9E87"
    },
    {
      id: "spirit-of-action-2026",
      title: "Spirit of Action Hackathon",
      category: "Achievement",
      description: "Earned 2nd place in the Education field and 9th place globally.",
      longDescription: "Recognised for a project developed within the Education category of the hackathon.",
      technologies: [],
      metrics: "2nd Education · 9th Global",
      year: "2026",
      accentColor: "#C9C3D8"
    },
    {
      id: "eminent-team-performance",
      title: "The Eminent Youth — Team Evoke",
      category: "Achievement",
      description: "Part of Team Evoke, recognised for outstanding team performance in Season 1.",
      technologies: [],
      metrics: "1st Place · Eminent Team Performance",
      year: "2026",
      accentColor: "#613F4D"
    },
    {
      id: "brainco-2025",
      title: "Brilliant Academic International Compitition",
      category: "Achievement",
      description: "Secured 2nd place in the Science category at the preliminary stage.",
      technologies: [],
      metrics: "2nd Place · Science",
      year: "2025",
      accentColor: "#C99B9B"
    },

    // ───────────── PROJECTS ─────────────

    {
      id: "dengue-eye",
      title: "DengueEye",
      category: "Team AI Project",
      description: "An AI-powered project focused on dengue risk monitoring and prediction, developed as part of Team DengueEye.",
      longDescription: "The project was developed for Infinity AI BuildFest, where the team reached the finalist stage. Its focus was on AI could supporting dengue-related risk monitoring and prediction.",
      technologies: [],
      metrics: "Infinity AI BuildFest Finalist",
      year: "2026",
      accentColor: "#8B9E87"
    },
    {
      id: "gwc-interactive-quiz",
      title: "Interactive Quiz",
      category: "JavaScript Experiment",
      description: "A browser-based interactive quiz created during the Girls Who Code Summer Pathways Web Development track.",
      longDescription: "Built as part of the TextJam learning experience, this project explored JavaScript-based interactivity and user interaction.",
      technologies: ["JavaScript"],
      year: "2026",
      accentColor: "#C99B9B"
    },
    {
      id: "gwc-cause-website",
      title: "Cause Advocacy Website",
      category: "Web Development Project",
      description: "A website created to raise awareness about a cause as part of the Girls Who Code Summer Pathways Web Development track.",
      longDescription: "Developed through the TextJam program, this project explored how a website can communicate an issue, present information, and encourage awareness.",
      technologies: [],
      year: "2026",
      accentColor: "#C9C3D8"
    }

  ],

  skills: [
    {
      name: "Mathematics, Research & Problem Solving",
      description: "Exploring complex ideas, approaching problems analytically, and learning through research.",
      skills: [
        { name: "Mathematical Reasoning", level: "Developing", context: "Mathematical problem-solving, logical reasoning, and competition mathematics" },
        { name: "Research & Documentation", level: "Experienced", context: "Literature reviews, research documentation, and organizing information" },
        { name: "Data Analysis", level: "Learning", context: "Exploring datasets and working with NumPy, Pandas, and Matplotlib" },
        { name: "Scientific Exploration", level: "Developing", context: "Exploring STEM concepts, research opportunities, and interdisciplinary ideas" }
      ]
    },
    {
      name: "Programming & Technology",
      description: "Learning by experimenting, building projects, and exploring how technology works.",
      skills: [
        { name: "Python", level: "Learning", context: "Programming fundamentals, problem-solving, and data-oriented projects" },
        { name: "HTML & CSS", level: "Applied", context: "Building web pages and personal web projects" },
        { name: "JavaScript", level: "Exploring", context: "Interactive web experiences and beginner front-end projects" },
        { name: "AI & Machine Learning", level: "Exploring", context: "Learning machine learning concepts, AI tools, and intelligent systems" }
      ]
    },
    {
      name: "Creative Design & Communication",
      description: "Combining visual creativity, communication, and thoughtful presentation.",
      skills: [
        { name: "Graphic Design", level: "Applied", context: "Creating visual assets and graphic design work" },
        { name: "UI/UX Design", level: "Exploring", context: "Interface design, visual structure, and user experience" },
        { name: "Digital Art", level: "Creative Practice", context: "Visual experimentation and digital artwork" },
        { name: "Writing & Documentation", level: "Applied", context: "Creative writing, academic documentation, and communication" }
      ]
    }
  ],

  experience: [
    {
      period: "Dec 2025 — Present",
      role: "Graphic Designer",
      company: "Grow With Globe",
      location: "Remote",
      description: "Working on graphic design and visual communication as part of the Grow With Globe team.",
      highlights: [
        "Contribute to the organization's visual communication through graphic design.",
        "Explore creative approaches to presenting ideas and information."
      ]
    },
    {
      period: "Mar 2026 — May 2026",
      role: "Research Mentor",
      company: "Grow With Globe",
      location: "Remote",
      description: "Worked as a research mentor in Mathematics and Computer Science.",
      highlights: [
        "Supported research-related learning and mentoring activities.",
        "Worked with research concepts, documentation, and Python-related learning."
      ]
    },
    {
      period: "Jun 2026 — Aug 2026",
      role: "Summer's Pathway Program Participant",
      company: "Girls Who Code",
      location: "Remote",
      description: "Selected for the 2026 Summer's Pathway Program and completed the Web Development track through TextJam.",
      highlights: [
        "Built a personal portfolio using HTML and CSS.",
        "Created a JavaScript-based interactive quiz.",
        "Developed a website advocating for a cause of personal interest.",
        "Applied core front-end development concepts across three projects."
      ]
    },
    {
      period: "Jan 2026 — Aug 2026",
      role: "Science Mentor",
      company: "Cadet Care Academy",
      location: "Mouchak, Dhaka",
      description: "Taught Science to 40+ students, primarily Grade 6 learners, through regular academic sessions.",
      highlights: [
        "Prepared and provided topic-wise study notes.",
        "Created practice questions to support students' preparation.",
        "Explained scientific concepts and supported students throughout their learning."
      ]
    },
    {
      period: "Nov 2025 — Present",
      role: "Global Student Ambassador",
      company: "Crimson Education",
      location: "Remote",
      description: "Serving as a Global Student Ambassador and participating in the student ambassador community.",
      highlights: [
        "Represent the student community as a Global Student Ambassador."
      ]
    },
    {
      period: "Nov 2025 — Present",
      role: "Sub-Head of R&D Department",
      company: "The Eminent Youth",
      location: "Remote",
      description: "Contributing to organizational research, strategic planning, and documentation.",
      highlights: [
        "Contribute to strategic planning and organizational research.",
        "Develop documentation for events and podcasts.",
        "Work on partnership and sponsorship documentation.",
        "Identify opportunities to strengthen organizational programs and initiatives."
      ]
    }
  ],

  education: [
    {
      period: "Jan 2025 — Dec 2026",
      degree: "Secondary Education — Science",
      institution: "Siddheswari Girls High School, Dhaka",
      notes: "Currently pursuing secondary education in the Science department (Grades 9–10)."
    },
    {
      period: "Jan 2022 — Dec 2024",
      degree: "Junior Secondary Education",
      institution: "BIAM Laboratory School, Brahmanbaria",
      notes: "Completed Grades 6–8 with GPA 5.00 (A+), scoring 916/1000 and securing 1st position in Class VIII."
    }
  ],

  gallery: [
  {
    id: "pen-illustration-1",
    title: "Untitled 01",
    category: "Pen Illustrations",
    aspectRatio: "portrait",
    description: "A pen illustration.",
    color: "#EEE8DE",
    image: "/gallery/IMG_1.jpg",
    tags: ["Pen", " Art"]
  },
  {
    id: "pen-illustration-2",
    title: "Untitled 02",
    category: "Pen Illustrations",
    aspectRatio: "portrait",
    description: "A pen illustration.",
    color: "#EEE8DE",
    image: "/gallery/IMG_2.jpg",
    tags: ["Pen", " Art"]
  },
  {
    id: "pen-illustration-3",
    title: "Untitled 03",
    category: "Pen Illustrations",
    aspectRatio: "portrait",
    description: "A pen illustration.",
    color: "#EEE8DE",
    image: "/gallery/IMG_3.jpg",
    tags: ["Pen", " Art"]
  },
  {
    id: "pen-illustration-4",
    title: "Untitled 04",
    category: "Pen Illustrations",
    aspectRatio: "portrait",
    description: "A pen illustration.",
    color: "#EEE8DE",
    image: "/gallery/IMG_4.jpg",
    tags: ["Pen", " Art"]
  }
]
};