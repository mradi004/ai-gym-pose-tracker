import Hero from "../components/Hero";
import Navbar from "../components/ui/Navbar";
import ExerciseList from "../components/ui/ExerciseList";
import HowItWorks from "../components/ui/HowItWorks";

function Landing() {
  return (
    <div className="w-full bg-white">
      <Navbar />
      <div className="" />
      <Hero />
      <div className="md:m-38 m-15" />
      <ExerciseList />
      <div className="m-18" />
      <HowItWorks />
    </div>
  );
}
export default Landing;
