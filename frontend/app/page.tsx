import { AnimatedAIChat } from "@/components/ChatInterface";
// import { CheckServer } from "@/components/CheckServer"; // Keep if needed elsewhere or uncommented

export default function Home() {
  return (
    <div className="w-screen h-full">
      <AnimatedAIChat />
    </div>
  );
}