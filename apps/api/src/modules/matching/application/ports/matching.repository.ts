import type { Vision } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { Candidate } from '../../domain/eligibility.js';

export interface PoolMember extends Candidate {
  species: 'GASTON' | 'PIA' | 'NINO' | 'SUZIE';
  vision: Vision;
  sunday: string;
}

export interface ProposalRow {
  id: string;
  petLowId: string;
  petHighId: string;
  userLowId: string;
  userHighId: string;
  kind: 'STRONG' | 'DISCOVERY' | 'ONBOARDING';
  visionScore: number;
  status: 'OPEN' | 'ACCEPTED' | 'EXPIRED' | 'INVALIDATED';
  expiresAt: Date;
  acceptedBy: string[];
  contextId: string | null;
}

export interface MatchingRepository {
  zones(): Promise<{ id: string; code: string; timezone: string }[]>;
  zoneOfUser(userId: string): Promise<{ id: string; timezone: string } | null>;
  pool(zoneId: string, at: Date): Promise<PoolMember[]>;
  blockedPairs(userIds: string[]): Promise<Set<string>>;
  metPairs(petIds: string[]): Promise<Set<string>>;
  openProposalCounts(userIds: string[], at: Date): Promise<Map<string, number>>;
  openPairs(at: Date): Promise<Set<string>>;
  startBatch(scope: TxScope, b: { id: string; zoneId: string; localDate: string; kind: string; algoVersion: string; tuningVersion: string }): Promise<boolean>;
  finishBatch(scope: TxScope, id: string, stats: Record<string, unknown>): Promise<void>;
  createProposal(scope: TxScope, p: Omit<ProposalRow, 'status' | 'acceptedBy' | 'contextId'> & { batchId: string; rankScore: number; breakdown: Record<string, number> }): Promise<void>;
  load(scope: TxScope | null, id: string): Promise<ProposalRow | null>;
  forUser(userId: string, at: Date): Promise<ProposalRow[]>;
  accept(scope: TxScope, proposalId: string, userId: string): Promise<boolean>;
  setStatus(scope: TxScope, id: string, status: ProposalRow['status'], contextId?: string): Promise<void>;
  expireDue(scope: TxScope, at: Date): Promise<number>;
  feedContext(userId: string, at: Date): Promise<{ verified: boolean; hasPet: boolean; paused: boolean }>;
  matchingInputs(scope: TxScope, userId: string, at: Date): Promise<{ verified: boolean; status: string; timezone: string; dateSpotHint: string | null }>;
}
export const MATCHING_REPOSITORY = Symbol('MatchingRepository');
