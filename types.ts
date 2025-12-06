export interface CatData {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  breed: CatBreed;
  createdAt: number;
  thought?: string;
  audioBuffer?: AudioBuffer;
  parentId?: string;
}

export enum CatBreed {
  TABBY = 'Tabby',
  SIAMESE = 'Siamese',
  PERSIAN = 'Persian',
  SCOTTISH_FOLD = 'Scottish Fold',
  BLACK = 'Black Cat'
}

export enum CatMood {
  HAPPY = 'Happy',
  GRUMPY = 'Grumpy',
  HUNGRY = 'Hungry',
  PLAYFUL = 'Playful',
  PHILOSOPHICAL = 'Philosophical',
  SLEEPY = 'Sleepy'
}

export type ToyType = 'laser' | 'yarn';

export interface ToyData {
  id: string;
  x: number;
  y: number;
  type: ToyType;
  createdAt: number;
  expiresAt: number;
}
