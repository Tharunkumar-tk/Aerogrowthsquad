// Mock sensor data and helpers
import tomatoImg from "@/assets/crops/tomato.jpg";
import bellPepperImg from "@/assets/crops/bell-pepper.jpg";
import strawberryImg from "@/assets/crops/strawberry.jpg";
import cornImg from "@/assets/crops/corn.jpg";
import palakImg from "@/assets/crops/palak.webp";
import araiKeeraiImg from "@/assets/crops/aarai-green.jpg";
import siruKeeraiImg from "@/assets/crops/siru-keerai.webp";

export interface SensorReading {
  ts: string;
  value: number;
}

export interface LatestMetrics {
  timestamp: string;
  pH: number;
  airTemp: number;
  waterTemp: number;
  tds: number;
  humidity: number;
  dissolved_oxygen_mg_l: number;
  pump_status: "on" | "off";
}

export const generateHistoricalData = (
  hours: number = 48,
  baseValue: number,
  variance: number
): SensorReading[] => {
  const data: SensorReading[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
    const randomVariance = (Math.random() - 0.5) * variance;
    data.push({
      ts: ts.toISOString(),
      value: parseFloat((baseValue + randomVariance).toFixed(2)),
    });
  }

  return data;
};

export const getLatestMetrics = (): LatestMetrics => {
  const metrics = {
    timestamp: new Date().toISOString(),
    pH: parseFloat((6.2 + (Math.random() - 0.5) * 0.4).toFixed(2)),
    airTemp: parseFloat((26 + (Math.random() - 0.5) * 2).toFixed(1)),
    waterTemp: parseFloat((21 + (Math.random() - 0.5) * 1).toFixed(1)),
    tds: parseFloat((420 + (Math.random() - 0.5) * 40).toFixed(0)),
    humidity: parseFloat((78 + (Math.random() - 0.5) * 10).toFixed(1)),
    dissolved_oxygen_mg_l: parseFloat((6.5 + (Math.random() - 0.5) * 1).toFixed(1)),
    pump_status: (Math.random() > 0.2 ? "on" : "off") as "on" | "off",
  };

  return metrics;
};

export const phHistory = generateHistoricalData(48, 6.3, 0.6);
export const airTempHistory = generateHistoricalData(48, 26, 3);
export const waterTempHistory = generateHistoricalData(48, 21, 1.5);
export const tdsHistory = generateHistoricalData(48, 420, 50);
export const humidityHistory = generateHistoricalData(48, 78, 12);

export const getStatusColor = (
  value: number,
  optimal: number,
  tolerance: number
): "good" | "warning" | "danger" => {
  const diff = Math.abs(value - optimal);
  if (diff < tolerance * 0.5) return "good";
  if (diff < tolerance) return "warning";
  return "danger";
};

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  message: string;
  timestamp: string;
}

export const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    message: "pH slightly elevated in Rack B",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "info",
    message: "Nutrient flush completed successfully",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "danger",
    message: "TDS out of range in Zone 3",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

export const cropData = [
  {
    id: "palak",
    name: "Palak (Spinach)",
    image: palakImg,
    description: "Nutrient-rich leafy green; optimal for tower farms",
    commonPests: ["aphids", "leaf miners", "downy mildew", "flea beetles"],
    inspectionAngle: "Leaf surface and stem base",
  },
  {
    id: "arai-keerai",
    name: "Arai Keerai",
    image: araiKeeraiImg,
    description: "Traditional Tamil leafy green; fast-growing",
    commonPests: ["aphids", "caterpillars", "leaf spot", "whiteflies"],
    inspectionAngle: "Leaf underside and growing tips",
  },
  {
    id: "siru-keerai",
    name: "Siru Keerai",
    image: siruKeeraiImg,
    description: "Small leafy green; excellent for vertical farming",
    commonPests: ["aphids", "thrips", "leaf miners", "spider mites"],
    inspectionAngle: "Leaf clusters and stem junction",
  },
  {
    id: "tomato",
    name: "Tomato",
    image: tomatoImg,
    description: "Fast-growing vine; sensitive to high humidity",
    commonPests: ["whiteflies", "aphids", "blight"],
    inspectionAngle: "Leaf underside & stem junction",
  },
  {
    id: "bell-pepper",
    name: "Bell Pepper",
    image: bellPepperImg,
    description: "Heat-loving crop; watch for bacterial spot",
    commonPests: ["aphids", "thrips", "bacterial spot", "pepper weevil"],
    inspectionAngle: "Leaf surface and fruit development",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    image: strawberryImg,
    description: "Delicate crop; prone to fungal issues",
    commonPests: ["spider mites", "aphids", "powdery mildew"],
    inspectionAngle: "Leaf underside and fruit surface",
  },
  {
    id: "corn",
    name: "Corn (Maize)",
    image: cornImg,
    description: "Heavy feeder; check for earworms",
    commonPests: ["corn earworm", "aphids", "armyworm"],
    inspectionAngle: "Leaf whorl and ear silk",
  },
];
