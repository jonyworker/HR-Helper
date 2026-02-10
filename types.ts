
export interface Participant {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  members: Participant[];
}

export type AppTab = 'participants' | 'lucky-draw' | 'team-splitter';

export interface DrawHistory {
  id: string;
  winner: string;
  timestamp: Date;
  prize?: string;
}
