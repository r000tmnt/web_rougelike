export interface item {
  id: string; // Encrypted string,
  name: string;
  type: number;
  rearity: number;
  desc: string;
  image: string; // Path of the image
  effect: {
    [name: string]: number;
  };
}
