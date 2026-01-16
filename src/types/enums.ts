// Tindera - Enumeration Types

export enum InventoryTransactionType {
	Receipt = 'receipt',
	Issue = 'issue',
	Sale = 'sale',
	Adjustment = 'adjustment',
	CountAdjustment = 'countAdjustment',
}

export enum UnitOfMeasure {
	Piece = 'piece',
	Ounce = 'ounce',
	Liter = 'liter',
	Gram = 'gram',
	Kilogram = 'kilogram',
	Milliliter = 'milliliter',
}

export enum InventoryAdjustmentType {
	Increase = 'increase',
	Decrease = 'decrease',
}

export enum ShopUserRole {
	Owner = 'owner',
	Admin = 'admin',
	Staff = 'staff',
}

export enum InventoryCountType {
	EndOfDay = 'End of Day',
	StartOfDay = 'Start of Day',
	Cycle = 'Cycle',
	Adhoc = 'Adhoc',
	Stocktake = 'Stocktake',
}

export const COUNT_TYPES = ['End of Day', 'Start of Day', 'Cycle', 'Adhoc', 'Stocktake'] as const;

export const INVENTORY_ADJUSTMENT_REASONS = [
	'Spoilage',
	'Theft',
	'Returns',
	'Damage',
	'Stock Count In',
	'Stock Count Out',
] as const;
