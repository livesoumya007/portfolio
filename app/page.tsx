import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import Experience from "@/components/experience/Experience";
import { Hero } from "@/components/hero/Hero";
import { Navbar } from "@/components/nav/Navbar";
import Projects from "@/components/projects/Projects";
import Skills from "@/components/skills/Skills";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* No top padding: the nav floats and its height changes as it
          condenses, so a fixed compensating pad can't stay correct. The hero
          carries its own clearance instead. */}
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </>
  );
}
