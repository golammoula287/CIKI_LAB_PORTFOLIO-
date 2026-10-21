import {
  Bot,
  ChartNoAxesCombined,
  Cpu,
  HeartPulse,
  Leaf,
  Network,
  ScanLine,
} from "lucide-react";

const icons = {
  "artificial-intelligence": Cpu,
  "computer-vision": ScanLine,
  "medical-imaging": HeartPulse,
  "data-science": ChartNoAxesCombined,
  robotics: Bot,
  "green-computing": Leaf,
};
export function ResearchIcon({ slug }: { slug: string }) {
  const Icon = icons[slug as keyof typeof icons] || Network;
  return (
    <span className="research-icon">
      <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}
