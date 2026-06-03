export interface GratitudeMessage {
  id: string;
  userId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  color: string; // 'peach' | 'banana' | 'cream' | 'mint' | 'rose'
  createdAt: string;
}

export interface SharedSong {
  id: string; // 'current'
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  addedByName: string;
  addedByPhoto?: string;
  addedAt: string;
}

export interface StaffPresence {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastActiveAt: string;
}

export interface ReactionCounts {
  energized: number;
  appreciated: number;
  inspired: number;
  supported: number;
}

export interface ChallengeReply {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  challengeId: string;
  createdAt: string;
}

export interface StaffMilestone {
  id: string;
  userId: string;
  userName: string;
  title: string;
  type: 'birthday' | 'achievement' | 'milestone';
  dateText: string;
  createdAt: string;
}
