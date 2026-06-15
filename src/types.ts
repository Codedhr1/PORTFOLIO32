export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  style: string;
  tags: string[];
  imageUrl: string;
  description: string;
  client: string;
  year: string;
  featured: boolean;
  longDescription?: string;
  detailImages?: string[];
  figmaLink?: string;
  liveUrl?: string;
}

export interface ProfileData {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  aboutText: string;
  consultationRate: number;
  consultationSub: string;
  heroImage: string;
  profileImage: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  price: string;
}
