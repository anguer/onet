import {
  ICalendarDay,
  ICalendarMonth,
  IChapter,
  IChapterLevel,
  IFavoriteItem,
  ILevel,
  IStandardLevel,
  LevelDifficulty,
  LevelStatus,
  LevelType,
} from 'db://assets/Nonogram/scripts/NonogramInterface';
import { dayjs } from 'db://assets/Nonogram/scripts/utils/Dayjs';

// 计算单行或单列的提示
function calculateLineHints(line: number[]): number[] {
  const hints: number[] = [];
  let count = 0;

  for (const pixel of line) {
    if (pixel === 1) {
      count++;
    } else if (count > 0) {
      hints.push(count);
      count = 0;
    }
  }

  if (count > 0) {
    hints.push(count);
  }

  return hints.length > 0 ? hints : [0];
}

interface NonogramLevelOptions {
  groupId: string;
  id: string;
  displayName: string;
  name: string;
  levelNumber: number;
  date?: Date;
  difficulty: LevelDifficulty;
  hints: number[];
  imagePath: string;
  status: LevelStatus;
  type: LevelType;
}

/**
 * 定义关卡数据结构
 */
export class NonogramLevel {
  // 所属篇章ID或日历ID
  public readonly groupId: string;
  // 关卡ID
  public readonly id: string;
  public readonly displayName: string;
  public readonly name: string;
  public readonly levelNumber: number;
  public readonly date: Date | undefined;
  public readonly difficulty: LevelDifficulty;
  public readonly imagePath: string;
  public readonly type: LevelType;
  // 提示列表: 0-不填色, 1-填色
  public readonly hints: number[];

  private _status: LevelStatus = LevelStatus.Uncompleted;
  public get status() {
    return this._status;
  }

  // 图像大小: 15x15
  public get imageSize(): number {
    return Math.sqrt(this.hints.length);
  }

  public get binaryRowsHints(): number[][] {
    const rows: number[][] = [];
    for (let i = 0; i < this.hints.length; i += this.imageSize) {
      const hints = this.hints.slice(i, i + this.imageSize);
      rows.push(hints);
    }
    return rows;
  }

  public get binaryColsHints(): number[][] {
    const cols = Array.from<never, number[]>({ length: this.imageSize }, () => []);
    for (let i = 0; i < this.hints.length; i += this.imageSize) {
      const hints = this.hints.slice(i, i + this.imageSize);
      for (let j = 0; j < hints.length; j++) {
        const rowIndex = j % this.imageSize;
        cols[rowIndex].push(hints[j]);
      }
    }
    return cols;
  }

  public get groupedRowsHints(): number[][] {
    return this.binaryRowsHints.map((hints) => calculateLineHints(hints));
  }

  public get groupedColsHints(): number[][] {
    return this.binaryColsHints.map((hints) => calculateLineHints(hints));
  }

  public get isValid(): boolean {
    return this.hints.length > 0 && this.imagePath.length > 0;
  }

  public static fromStandard(data: IStandardLevel): NonogramLevel {
    return new NonogramLevel({
      type: LevelType.Standard,
      groupId: '',
      displayName: `第 ${data.levelNumber} 关`,
      status: LevelStatus.Uncompleted,
      ...data,
    });
  }

  public static fromChapter(data: IChapterLevel, chapter: IChapter): NonogramLevel {
    return new NonogramLevel({
      type: LevelType.Chapter,
      groupId: chapter.id,
      displayName: chapter.name,
      levelNumber: 0,
      ...data,
    });
  }

  public static fromCalendar(data: ICalendarDay, calendar: ICalendarMonth): NonogramLevel {
    const day = dayjs(data.date);
    return new NonogramLevel({
      type: LevelType.DailyChallenge,
      groupId: calendar.id,
      displayName: day.format('M月D日'),
      date: day.toDate(),
      levelNumber: 0,
      ...data.challenge,
    });
  }

  public static fromTutorial(data: ILevel): NonogramLevel {
    return new NonogramLevel({
      type: LevelType.Tutorial,
      groupId: 'tutorial',
      displayName: '新手教程',
      status: LevelStatus.Uncompleted,
      levelNumber: 0,
      ...data,
    });
  }

  public static fromFavorite({ id, groupId, ...level }: IFavoriteItem): NonogramLevel {
    return new NonogramLevel({
      type: LevelType.Favorite,
      displayName: '我的收藏',
      status: LevelStatus.Completed,
      levelNumber: 0,
      id,
      groupId,
      ...level,
    });
  }

  private constructor(data: NonogramLevelOptions) {
    this.groupId = data.groupId;
    this.type = data.type;
    this.id = data.id;
    this.displayName = data.displayName;
    this.name = data.name;
    this.levelNumber = data.levelNumber;
    this.difficulty = data.difficulty;
    this.hints = data.hints;
    this.imagePath = data.imagePath;
    this.date = data.date;
    this._status = data.status;
  }

  public completed() {
    this._status = LevelStatus.Completed;
  }
}
