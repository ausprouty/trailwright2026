export type IWillStatus = 'active' | 'completed' | 'abandoned';

export type IWillItem = {
  id: string;
  study: string;
  lesson: number;
  position: number;
  statement: string;
  createdAt: string;
  updatedAt: string;
  status: IWillStatus;
  completedAt: string | null;
  abandonedAt: string | null;
};
