import type { OfficesOfficeId } from './Offices.js';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for app.positions */
export type PositionsKey = string;

/** Represents the table app.positions */
export default interface PositionsTable {
  office_id: ColumnType<OfficesOfficeId, OfficesOfficeId, OfficesOfficeId>;

  key: ColumnType<PositionsKey, PositionsKey, PositionsKey>;

  name: ColumnType<string, string, string>;

  description: ColumnType<string, string, string>;
}

export type Positions = Selectable<PositionsTable>;

export type NewPositions = Insertable<PositionsTable>;

export type PositionsUpdate = Updateable<PositionsTable>;