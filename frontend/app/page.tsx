import { AnimatedAIChat } from "@/components/ChatInterface";
import { CheckServer } from "@/components/CheckServer";

export default function Home() {
  return (
    <div className="relative w-screen min-h-screen">
      
      <div className="absolute top-1/8 left-1/2 transform -translate-x-1/2 z-10">
        <CheckServer/>
      </div>
      
      {/* Main Content */}
      <div className="w-full">
        <AnimatedAIChat />
      </div>
    </div>
  );
}
