import {
  Award,
  Brush,
  CircleDot,
  CloudSun,
  Contrast,
  Droplets,
  Eraser,
  Eye,
  Smile,
  Frame,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Moon,
  Palette,
  ScanFace,
  Scissors,
  Shirt,
  Sparkles,
  Sun,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { ToolPreset } from "./types";

const iconClass = "h-5 w-5 text-[#2563EB]";

function icon(Icon: LucideIcon) {
  return <Icon className={iconClass} />;
}

export const TOOL_PRESETS: ToolPreset[] = [
  {
    id: "face-enhance",
    name: "Face Enhance",
    description: "AI retouching for face, skin and facial details.",
    icon: <ScanFace className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Skin Smoothing",
        description: "Smooth skin while keeping natural texture.",
        icon: icon(Sparkles),
      },
      {
        name: "Blemish Removal",
        description: "Clean spots, acne and small distractions.",
        icon: icon(Eraser),
      },
      {
        name: "Dark Circle Fix",
        description: "Reduce visible under-eye darkness naturally.",
        icon: icon(Moon),
      },
      {
        name: "Teeth Whitening",
        description: "Brighten teeth with a natural finish.",
        icon: icon(Smile),
      },
      {
        name: "Eye Enhance",
        description: "Improve eye clarity, brightness and detail.",
        icon: icon(Eye),
      },
      {
        name: "Wrinkle Softening",
        description: "Soften prominent wrinkles without flattening the face.",
        icon: icon(Brush),
      },
      {
        name: "Face Relighting",
        description: "Add balanced light to the face and restore depth.",
        icon: icon(Lightbulb),
      },
      {
        name: "Hair Detail Enhance",
        description: "Recover fine hair detail and reduce dullness.",
        icon: icon(Scissors),
      },
    ],
  },
  {
    id: "photo-color",
    name: "Photo Color",
    description: "AI color correction, recovery and color balance.",
    icon: <Palette className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Auto Color",
        description: "Automatically correct overall color and cast.",
        icon: icon(Palette),
      },
      {
        name: "White Balance",
        description: "Neutralize unwanted warm or cool color casts.",
        icon: icon(CloudSun),
      },
      {
        name: "Vibrance Boost",
        description: "Add life to muted colors while protecting skin tones.",
        icon: icon(Sparkles),
      },
      {
        name: "Saturation Balance",
        description: "Recover color intensity without harsh oversaturation.",
        icon: icon(Droplets),
      },
      {
        name: "Skin Tone Balance",
        description: "Keep facial skin tones consistent and natural.",
        icon: icon(Smile),
      },
      {
        name: "Colorize B&W",
        description: "Add realistic color to black-and-white photos.",
        icon: icon(ImageIcon),
      },
      {
        name: "Color Harmony",
        description: "Balance the main colors for a cleaner visual palette.",
        icon: icon(Palette),
      },
    ],
  },
  {
    id: "photo-light",
    name: "Photo Light",
    description: "AI exposure, lighting and tonal corrections.",
    icon: <Lightbulb className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Exposure Fix",
        description: "Correct underexposure or overexposure.",
        icon: icon(Sun),
      },
      {
        name: "Highlight Recovery",
        description: "Recover detail from bright areas.",
        icon: icon(Lightbulb),
      },
      {
        name: "Shadow Recovery",
        description: "Lift dark areas while preserving contrast.",
        icon: icon(Moon),
      },
      {
        name: "AI Relight",
        description: "Rebalance light direction and depth across the photo.",
        icon: icon(CloudSun),
      },
      {
        name: "Contrast Balance",
        description: "Improve tonal separation without crushing details.",
        icon: icon(Contrast),
      },
      {
        name: "Dehaze",
        description: "Reduce haze and restore scene clarity.",
        icon: icon(Wand2),
      },
    ],
  },
  {
    id: "dress-style",
    name: "Dress Style",
    description: "AI clothing edits while preserving the person.",
    icon: <Shirt className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Outfit Color Change",
        description: "Change clothing color while preserving the outfit shape.",
        icon: icon(Shirt),
      },
      {
        name: "Pattern Swap",
        description: "Replace a clothing pattern or texture.",
        icon: icon(Layers),
      },
      {
        name: "Clothing Cleanup",
        description: "Remove wrinkles, lint and minor clothing distractions.",
        icon: icon(Scissors),
      },
      {
        name: "Outfit Relight",
        description: "Match clothing lighting to the scene naturally.",
        icon: icon(Lightbulb),
      },
    ],
  },
  {
    id: "photo-background",
    name: "Photo Background",
    description: "AI background separation, replacement and cleanup.",
    icon: <ImageIcon className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Background Remove",
        description: "Cut out the main subject cleanly.",
        icon: icon(Eraser),
      },
      {
        name: "Background Blur",
        description: "Create a portrait-style depth blur.",
        icon: icon(Eye),
      },
      {
        name: "Background Replace",
        description: "Generate or place a new background behind the subject.",
        icon: icon(ImageIcon),
      },
      {
        name: "Background Cleanup",
        description: "Remove distracting background objects or clutter.",
        icon: icon(Wand2),
      },
      {
        name: "Background Relight",
        description: "Match background light with the subject.",
        icon: icon(Sun),
      },
    ],
  },
  {
    id: "old-photo-to-new",
    name: "Old Photo to New",
    description: "Restore damaged, faded and low-detail old photos.",
    icon: <Sparkles className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Scratch Repair",
        description: "Repair scratches and visible surface damage.",
        icon: icon(Brush),
      },
      {
        name: "Dust & Artifact Removal",
        description: "Clean dust, marks and scanning artifacts.",
        icon: icon(Eraser),
      },
      {
        name: "Photo Colorize",
        description: "Colorize faded or black-and-white historical photos.",
        icon: icon(Palette),
      },
      {
        name: "Face Restoration",
        description: "Recover missing or soft facial details.",
        icon: icon(ScanFace),
      },
      {
        name: "Detail Recovery",
        description: "Improve sharpness and lost fine detail.",
        icon: icon(Sparkles),
      },
    ],
  },
  {
    id: "studio-image",
    name: "Studio Image",
    description: "AI studio lighting and professional portrait finishing.",
    icon: <Award className="h-6 w-6 text-[#2563EB]" />,
    tools: [
      {
        name: "Studio Light",
        description: "Create a clean professional portrait lighting setup.",
        icon: icon(Lightbulb),
      },
      {
        name: "Professional Background",
        description: "Place the subject into a clean studio environment.",
        icon: icon(Frame),
      },
      {
        name: "Portrait Relight",
        description: "Shape facial light for a studio-style result.",
        icon: icon(Sun),
      },
      {
        name: "Softbox Effect",
        description: "Simulate soft, flattering studio light.",
        icon: icon(CloudSun),
      },
      {
        name: "Studio Retouch",
        description: "Apply a final clean professional portrait finish.",
        icon: icon(Wand2),
      },
    ],
  },
];
