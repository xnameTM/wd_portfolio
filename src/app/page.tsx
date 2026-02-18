"use client";

import { useEffect, useMemo, useState } from "react";
import ThreeScene from "@/components/ThreeScene";
import LoadingOverlay from "@/components/LoadingOverlay";

const NAV_ITEMS = [
  { id: "intro", label: "Intro" },
  { id: "about", label: "Profile" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

const SKILLS = {
  Frontend: ["HTML5", "CSS", "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Angular (basics)", "Three.js (learning)"],
  Backend: ["Express.js", "NestJS", "MySQL", "MongoDB"],
  Other: ["GIT", "Python", "Figma (basics)", "Postman", "Photoshop"],
};

const PROJECTS = [
  {
    name: "Mieszkanie na polanie (deleted)",
    role: "Fullstack Developer",
    stack: "Express.js, Handlebars, TypeScript",
    summary:
      "A modern and functional website for a new residential development. Presents details of the investment, location information, construction progress, and apartment offerings.",
    link: "https://mieszkanienapolanie.pl/",
  },
  {
    name: "myArt",
    role: "Mobile Developer",
    stack: "React Native, Expo, Reanimated, TypeScript",
    summary:
      "Expo-based mobile application utilizing the Art Institute of Chicago's API. Features exploring, searching, filtering, and saving artworks with gesture-based interactions.",
    link: "https://github.com/xnameTM/myArt",
  },
  {
    name: "BookScan (during dev)",
    role: "AI / Mobile Developer",
    stack: "React Native, Expo, TypeScript, Python, PyTorch",
    summary:
      "Mobile application for intelligent book scanning. Detects pages in real time, automatically crops and enhances them using a custom-trained neural network.",
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );

    const indexById = new Map<string, number>();
    sections.forEach((section, index) => {
      indexById.set(section.id, index);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const nextIndex = indexById.get(entry.target.id);
          if (nextIndex !== undefined) {
            setActiveSection(nextIndex);
          }
        });
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0.25,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const skillsColumns = useMemo(() => Object.entries(SKILLS), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <ThreeScene activeSection={activeSection} isLoading={isLoading} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="absolute inset-0 scanlines opacity-40" />
      </div>

      <LoadingOverlay durationMs={5000} onFinish={() => setIsLoading(false)} />

      <header className="relative z-20 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
            <span>Signal Online</span>
          </div>
          <nav className="hidden gap-6 text-xs uppercase tracking-[0.2em] text-slate-400 md:flex">
            {NAV_ITEMS.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`transition ${
                  activeSection === index
                    ? "text-[color:var(--accent)]"
                    : "hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-20 mx-auto flex max-w-6xl flex-col gap-24 px-6 py-16">
        <section
          id="intro"
          data-section
          className="grid min-h-[75vh] items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Portfolio Interface
            </p>
            <h1 className="glitch text-4xl font-semibold leading-tight sm:text-5xl" style={{ textShadow: '0 0 24px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)'}}>
              Hi there, I'm Mark Kotarba
              <span className="block text-xl font-normal text-slate-300">
                Creative Developer + Web Engineer
              </span>
            </h1>
            <p className="max-w-xl text-base text-slate-300" style={{ textShadow: '0 0 32px rgba(0, 0, 0, 1), 0 0 32px rgba(0, 0, 0, 1), 0 0 32px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)'}}>
              A young programmer passionate about developing skills in creating modern and attractive websites. I eagerly learn new technologies and tools, continuously expanding my knowledge. I quickly resolve coding errors, effectively addressing encountered issues. My projects stand out for their aesthetics and functionality, capturing users' attention.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://github.com/xnameTM" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[color:var(--accent)] px-6 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] transition hover:bg-[color:var(--accent)] hover:text-black" style={{ textShadow: '0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)'}}>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/marek-kotarba-58b603239/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white" style={{ textShadow: '0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)'}}>
                LinkedIn
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
            <div className="space-y-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              <p>Scroll to morph the scene</p>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/70 p-6">
              <p className="text-sm text-slate-300">
                System status: ready
              </p>
              <p className="text-xs text-slate-500">Session id: 0xA1-7F</p>
            </div>
          </div>
        </section>

        <section
          id="about"
          data-section
          className="grid gap-10 rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Profile
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              About me
            </h2>
          </div>
          <div className="space-y-4 text-slate-300">
            <p>
              I'm a young programmer with a passion for creating modern, attractive, and functional websites. I believe in continuous learning and constantly seek to expand my knowledge with new technologies and tools.
            </p>
            <p>
              I excel at quickly identifying and resolving coding errors, and I take pride in delivering projects that stand out for both their aesthetics and functionality. My goal is to create user experiences that capture attention and deliver real value.
            </p>
          </div>
        </section>

        <section id="skills" data-section className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}>
              Capabilities
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}>Skills</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {skillsColumns.map(([group, items]) => (
              <div
                key={group}
                className="rounded-2xl border border-white/10 bg-black/60 p-6"
              >
                <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  {group}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" data-section className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}>
              Field work
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}>
              Selected projects
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <a
                key={project.name}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-black/60 p-6 transition hover:border-[color:var(--accent)]/50 hover:bg-black/80"
              >
                <h3 className="text-lg font-semibold text-white">
                  {project.name}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  {project.role}
                </p>
                <p className="mt-4 text-sm text-slate-300">
                  {project.summary}
                </p>
                <p className="mt-4 text-xs text-slate-500">{project.stack}</p>
              </a>
            ))}
          </div>
        </section>

        <section
          id="contact"
          data-section
          className="grid gap-10 rounded-3xl border border-white/10 bg-black/70 p-8 backdrop-blur lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Contact
            </p>
            <h2 className="text-3xl font-semibold text-white">
              Let's connect
            </h2>
            <p className="text-slate-300">
              I'm always interested in new projects and opportunities. Feel free to reach out via GitHub, LinkedIn, or Facebook.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="https://github.com/xnameTM" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:text-white transition">
                GitHub
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www.linkedin.com/in/marek-kotarba-58b603239/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:text-white transition">
                LinkedIn
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www.facebook.com/amiri4ever/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:text-white transition">
                Facebook
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Status
            </p>
            <p className="mt-4 text-lg text-white">Open for new projects</p>
            <p className="mt-2 text-sm text-slate-500">
              © 2026 Marek Kotarba
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
