// Form Field Components - Reusable form input wrappers with react-hook-form integration

import {
	IonButton,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonSelect,
	IonSelectOption,
	IonTextarea,
	IonToggle,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import type { Control, FieldError, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';

// Shared error display component
const FieldErrorDisplay: React.FC<{ error?: FieldError }> = ({ error }) => {
	if (!error) return null;
	return (
		<div
			style={{
				color: 'var(--ion-color-danger)',
				fontSize: '12px',
				padding: '4px 0',
			}}
		>
			{error.message}
		</div>
	);
};

// Text Input Field
interface TextFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	type?: 'text' | 'email' | 'password' | 'tel' | 'url';
	disabled?: boolean;
}

export function TextField<T extends FieldValues>({
	name,
	control,
	label,
	placeholder,
	required = false,
	error,
	type = 'text',
	disabled = false,
}: TextFieldProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, onBlur, value } }) => (
					<IonInput
						fill="outline"
						label={required ? `${label} *` : label}
						labelPlacement="floating"
						value={value || ''}
						type={type}
						onIonInput={(e) => onChange(e.detail.value)}
						onIonBlur={onBlur}
						placeholder={placeholder}
						className={error ? 'ion-invalid' : ''}
						disabled={disabled}
					/>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

// Textarea Field
interface TextAreaFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	rows?: number;
	disabled?: boolean;
}

export function TextAreaField<T extends FieldValues>({
	name,
	control,
	label,
	placeholder,
	required = false,
	error,
	rows = 3,
	disabled = false,
}: TextAreaFieldProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, onBlur, value } }) => (
					<IonTextarea
						fill="outline"
						label={required ? `${label} *` : label}
						labelPlacement="floating"
						value={value || ''}
						onIonInput={(e) => onChange(e.detail.value)}
						onIonBlur={onBlur}
						placeholder={placeholder}
						rows={rows}
						className={error ? 'ion-invalid' : ''}
						disabled={disabled}
					/>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

// Select Field
interface SelectOption {
	value: string;
	label: string;
}

interface SelectFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	options: SelectOption[];
	interface?: 'action-sheet' | 'alert' | 'popover';
	disabled?: boolean;
}

export function SelectField<T extends FieldValues>({
	name,
	control,
	label,
	placeholder,
	required = false,
	error,
	options,
	interface: selectInterface = 'popover',
	disabled = false,
}: SelectFieldProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value } }) => (
					<IonSelect
						fill="outline"
						label={required ? `${label} *` : label}
						labelPlacement="floating"
						value={value}
						onIonChange={(e) => onChange(e.detail.value)}
						placeholder={placeholder}
						interface={selectInterface}
						disabled={disabled}
					>
						{options.map((option) => (
							<IonSelectOption key={option.value} value={option.value}>
								{option.label}
							</IonSelectOption>
						))}
					</IonSelect>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

// Price Input Field
interface PriceFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	disabled?: boolean;
	currency?: string;
}

export function PriceField<T extends FieldValues>({
	name,
	control,
	label,
	placeholder = '0.00',
	required = false,
	error,
	disabled = false,
	currency = 'USD',
}: PriceFieldProps<T>) {
	const [isFocused, setIsFocused] = useState(false);

	const formatCurrency = (value: number | null | undefined) => {
		if (value === null || value === undefined || Number.isNaN(value)) return '';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	};

	const parseValue = (inputValue: string): number => {
		// Remove non-numeric characters except decimal point
		const cleaned = inputValue.replace(/[^0-9.]/g, '');
		// Ensure only one decimal point
		const parts = cleaned.split('.');
		const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
		const parsed = parseFloat(formatted);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, onBlur, value } }) => (
					<IonInput
						fill="outline"
						label={required ? `${label} *` : label}
						labelPlacement="floating"
						type="text"
						inputMode="decimal"
						value={isFocused ? value || '' : formatCurrency(value)}
						onIonInput={(e) => {
							if (isFocused) {
								const inputValue = e.detail.value || '';
								// Only allow numbers and one decimal point
								const cleaned = inputValue.replace(/[^0-9.]/g, '');
								const parts = cleaned.split('.');
								const formatted = parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleaned;
								onChange(parseValue(formatted));
							}
						}}
						onIonFocus={() => setIsFocused(true)}
						onIonBlur={(_e) => {
							setIsFocused(false);
							onBlur();
						}}
						placeholder={placeholder}
						className={error ? 'ion-invalid' : ''}
						disabled={disabled}
					/>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

// Number Input Field (for integers/decimals that aren't currency)
interface NumberFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	disabled?: boolean;
	min?: number;
	max?: number;
	step?: number | 'any';
}

export function NumberField<T extends FieldValues>({
	name,
	control,
	label,
	placeholder = '0',
	required = false,
	error,
	disabled = false,
	min,
	max,
	step = 1,
}: NumberFieldProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, onBlur, value } }) => (
					<IonInput
						fill="outline"
						label={required ? `${label} *` : label}
						labelPlacement="floating"
						type="number"
						inputMode="numeric"
						value={value !== null && value !== undefined ? String(value) : ''}
						onIonInput={(e) => {
							const val = e.detail.value;
							onChange(val === '' ? null : parseFloat(val || '0'));
						}}
						onIonBlur={onBlur}
						placeholder={placeholder}
						min={min !== undefined ? String(min) : undefined}
						max={max !== undefined ? String(max) : undefined}
						step={String(step)}
						className={error ? 'ion-invalid' : ''}
						disabled={disabled}
					/>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

// Select Field with Add Button
interface SelectFieldWithAddProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: FieldError;
	options: SelectOption[];
	interface?: 'action-sheet' | 'alert' | 'popover';
	disabled?: boolean;
	onAddClick: () => void;
}

export function SelectFieldWithAdd<T extends FieldValues>({
	name,
	control,
	label,
	placeholder,
	required = false,
	error,
	options,
	interface: selectInterface = 'popover',
	disabled = false,
	onAddClick,
}: SelectFieldWithAddProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<div className="ion-flex-gap ion-align-items-start">
				<div style={{ flex: 1 }}>
					<Controller
						name={name}
						control={control}
						render={({ field: { onChange, value } }) => (
							<IonSelect
								fill="outline"
								label={required ? `${label} *` : label}
								labelPlacement="floating"
								value={value}
								onIonChange={(e) => onChange(e.detail.value)}
								placeholder={placeholder}
								interface={selectInterface}
								disabled={disabled}
							>
								{options.map((option) => (
									<IonSelectOption key={option.value} value={option.value}>
										{option.label}
									</IonSelectOption>
								))}
							</IonSelect>
						)}
					/>
					<FieldErrorDisplay error={error} />
				</div>
				<IonButton
					fill="outline"
					onClick={onAddClick}
					disabled={disabled}
					size="large"
					style={{
						'--border-color': 'var(--input-border-color)',
						'--color': 'var(--ion-color-medium)',
					}}
				>
					<IonIcon slot="icon-only" icon={add} />
				</IonButton>
			</div>
		</div>
	);
}

// Toggle Field
interface ToggleFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label: string;
	error?: FieldError;
	disabled?: boolean;
}

export function ToggleField<T extends FieldValues>({
	name,
	control,
	label,
	error,
	disabled = false,
}: ToggleFieldProps<T>) {
	return (
		<div style={{ marginBottom: 'var(--space-md)' }}>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value } }) => (
					<IonItem>
						<IonLabel>{label}</IonLabel>
						<IonToggle
							checked={!!value}
							onIonChange={(e) => onChange(e.detail.checked)}
							disabled={disabled}
						/>
					</IonItem>
				)}
			/>
			<FieldErrorDisplay error={error} />
		</div>
	);
}

export type { SelectOption };
