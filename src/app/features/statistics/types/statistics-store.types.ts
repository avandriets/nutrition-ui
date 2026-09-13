import type { UserIdentity } from '../../../shared/domain/identity.types';
import type { AverageReport, DailyGoalReport, TimelineGranularity, TimelineReport } from './statistics.types';

export interface StatisticsInitialData {
  accountId: number;
  users: UserIdentity[];
}

export interface DailyStatisticsParams {
  accountId: number;
  users: UserIdentity[];
  selectedDay: string;
}

export interface PeriodStatisticsParams {
  accountId: number;
  users: UserIdentity[];
  dateFrom: string;
  dateTo: string;
  granularity: TimelineGranularity;
  includeEmptyDays: boolean;
}

export interface PeriodStatisticsData {
  averageReports: AverageReport[];
  timelineReports: TimelineReport[];
}

export type DailyStatisticsData = DailyGoalReport[];
