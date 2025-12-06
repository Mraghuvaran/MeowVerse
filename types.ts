
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
  BLACK = 'Black Cat',
  SPHYNX = 'Sphynx',
  RAGDOLL = 'Ragdoll',
  BENGAL = 'Bengal'
}

export enum CatMood {
  HAPPY = 'Happy',
  GRUMPY = 'Grumpy',
  HUNGRY = 'Hungry',
  PLAYFUL = 'Playful',
  PHILOSOPHICAL = 'Philosophical',
  SLEEPY = 'Sleepy'
}
