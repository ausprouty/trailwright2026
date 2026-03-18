export type OikosStatus =
  | 'non-believer'
  | 'believer'
  | 'new-believer'
  | 'follower'
  | 'missional-leader';

export type OikosListItem = {
  name: string;
  status: OikosStatus | '';
  nextStep: string;
  nextStepDate: string;
};
