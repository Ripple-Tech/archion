import Hero from "@/components/Hero";
import PeepReveal from "@/components/Peepreveal";
import ProjectsGrid from "@/components/Projectsgrid";
import Image from "next/image";

export default function Home() {
  return (
    <div >
      <Hero />
      <PeepReveal />
      <ProjectsGrid />
    </div>
  );
}
