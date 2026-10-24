import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import Pricing from "./landing/Pricing";
import About from "./landing/About";
import Footer from "./landing/Footer";

export default function LandingPage() {
  return (
    <div className="scroll-smooth bg-white font-sans text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <About />
      </main>
      <Footer />
    </div>
  );
}
