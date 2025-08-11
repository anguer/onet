export enum LevelType {
  // 普通关卡
  Standard = 'standard',
  // 特别篇章
  Chapter = 'chapter',
  // 挑战
  Challenge = 'challenge',
  // 每日挑战
  DailyChallenge = 'daily_challenge',
  // 教程
  Tutorial = 'tutorial',
  // 收藏
  Favorite = 'favorite',
}

export enum FavoriteType {
  // 普通关卡
  Standard = 'standard',
  // 特别篇章
  Chapter = 'chapter',
  // 每日挑战
  DailyChallenge = 'daily_challenge',
  // 活动
  Event = 'event',
}

export enum ChapterStatus {
  Completed = 'Completed',
  Unlocked = 'Unlocked',
  Locked = 'Locked',
}

export enum LevelStatus {
  Uncompleted = 'Uncompleted',
  Completed = 'Completed',
  Locked = 'Locked',
}

export enum LevelDifficulty {
  Easy = 'Easy',
  Normal = 'Normal',
  Hard = 'Hard',
  Expert = 'Expert',
}

export enum RewardType {
  Coin = 'Coin',
  Bulb = 'Bulb',
  Energy = 'Energy',
}

export type Nullable<T> = T | null;

export interface IReward {
  type: RewardType;
  count: number;
}

/**
 * 基础关卡类型
 */
export interface ILevel {
  id: string;
  name: string;
  difficulty: LevelDifficulty;
  imagePath: string;
  hints: number[];
}

export interface IStandardLevel extends ILevel {
  levelNumber: number;
}

export interface IChapter {
  id: string;
  name: string;
  completedCount: number;
  levelCount: number;
  status: ChapterStatus;
  imagePath: string;
}

/**
 * 篇章关卡类型
 */
export interface IChapterLevel extends ILevel {
  status: LevelStatus;
}

export interface ICalendar {
  id: string;
  name: string;
  date: string;
}

/**
 * 挑战关卡类型
 */
export interface IChallenge extends ILevel {
  status: LevelStatus;
}

export interface ICalendarMonth extends ICalendar {
  levelCount: number;
  completedCount: number;
  rewardClaims: { rewardIndex: number }[];
}

export interface ICalendarDay extends ICalendar {
  challenge: IChallenge;
}

export interface IFavoriteItem extends Pick<ILevel, 'id' | 'name' | 'imagePath' | 'difficulty' | 'hints'> {
  groupId: string;
  // 暂时不需要favoriteId
  // favoriteId: string;
}

export enum UnlockType {
  // 观看广告获取
  WatchAd = 'WatchAd',
  // 活动获取
  Event = 'Event',
  // 免费
  Free = 'Free',
}

export interface IUnlockCondition {
  id: string;
  type: UnlockType;
  requiredCount: number;
}

export interface ICustomization {
  id: string;
  name: string;
  imagePath: string;
  unlockCondition: IUnlockCondition & {
    currentCount: number;
  };
  isUnlocked: boolean;
}

export interface IPlayer {
  id: string;
  nick: string;
  avatar: string;
  banner: string;
  coins: number;
  tips: number;
  energies: number;
  lastRecoveryTime: string;
}

export interface IPlayerMedal {
  gold: number;
  silver: number;
  bronze: number;
}

export interface ILeaderboardWithPlayerInterface extends Pick<IPlayer, 'nick' | 'avatar' | 'banner'> {
  playerId: string;
  rank: number;
  stars: number;
  medal: Nullable<IPlayerMedal>;
}

export interface ILeaderboardResult {
  list: ILeaderboardWithPlayerInterface[];
  self: ILeaderboardWithPlayerInterface;
}

export interface ILevelCompleteResult {
  settlement: Nullable<{
    totalStars: number;
    stars: number;
    levels: number;
    points: number;
  }>;
  clearBonus: number;
  firstClearBonus: number;
  nextLevel: Nullable<IStandardLevel>;
}

export interface IGameCLubTask {
  id: string;
  taskType: 'ONCE' | 'DAILY' | 'WEEKLY';
  taskCode: 'Join' | 'DailyLike' | 'DailyComment' | 'DailyPublish';
  type: number;
  date: string;
  targetCount: number;
  isClaimed: boolean;
  completedCount: number;
  isCompleted: boolean;
  rewards: Array<{ type: RewardType; count: number }>;
}
