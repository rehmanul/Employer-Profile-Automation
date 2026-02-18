export type ImageItem =
  | {
      formats?: Array<{ src: string; format: string }>;
      src?: string;
    }
  | string;

export interface Profile {
  id: string;
  url: string;
  status: "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
  data?: {
    success?: boolean;
    domain?: string;
    name?: string;
    description?: string;
    employerText?: string;
    matchedBenefits?: string;
    folderUrl?: string;
    docUrl?: string;
    qualityScore?: number;
    logos?: Array<{ type: string; formats: Array<{ src: string; format: string }> }>;
    images?: ImageItem[];
    colors?: Array<{ hex: string; type: string; brightness: number }>;
    fonts?: Array<{ name: string; type: string }>;
    links?: Array<{ url: string; name: string }>;
    [key: string]: any;
  };
}
