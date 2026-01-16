// ImageUpload - Reusable drag-and-drop image upload component

import { IonButton, IonIcon } from '@ionic/react';
import { cloudUpload, image as imageIcon, trash } from 'ionicons/icons';
import type React from 'react';
import { useRef, useState } from 'react';
import './ImageUpload.css';

interface ImageUploadProps {
	/** Current image URL to display */
	value?: string | null;
	/** Callback when a file is selected */
	onFileSelect: (file: File) => void;
	/** Callback when image is removed */
	onRemove?: () => void;
	/** Maximum file size in bytes (default: 5MB) */
	maxSize?: number;
	/** Allowed file types (default: image/jpeg, image/png, image/webp, image/gif) */
	acceptedTypes?: string[];
	/** Whether the component is disabled */
	disabled?: boolean;
	/** Custom width for the upload area (default: 100%) */
	width?: string;
	/** Custom height for the upload area (default: 300px) */
	height?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const ImageUpload: React.FC<ImageUploadProps> = ({
	value,
	onFileSelect,
	onRemove,
	maxSize = DEFAULT_MAX_SIZE,
	acceptedTypes = DEFAULT_ACCEPTED_TYPES,
	disabled = false,
	width = '100%',
	height = '300px',
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): string | null => {
		// Check file type
		if (!acceptedTypes.includes(file.type)) {
			return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
		}

		// Check file size
		if (file.size > maxSize) {
			const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
			return `File size exceeds ${maxSizeMB}MB limit`;
		}

		return null;
	};

	const handleFile = (file: File) => {
		setError(null);

		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreview(reader.result as string);
		};
		reader.readAsDataURL(file);

		// Call parent callback
		onFileSelect(file);
	};

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!disabled) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		if (disabled) return;

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleClick = () => {
		if (!disabled) {
			fileInputRef.current?.click();
		}
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPreview(null);
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		onRemove?.();
	};

	const displayImage = preview || value;

	return (
		<div className="image-upload-container" style={{ width }}>
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept={acceptedTypes.join(',')}
				onChange={handleFileInputChange}
				className="image-upload-input"
				disabled={disabled}
			/>

			{/* Upload area */}
			<button
				type="button"
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleClick();
					}
				}}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`image-upload-area ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''} ${displayImage ? 'has-image' : ''}`}
				style={{ height }}
				disabled={disabled}
			>
				{displayImage ? (
					<>
						{/* Image preview */}
						<img src={displayImage} alt="Preview" className="image-upload-preview" />

						{/* Remove button */}
						{!disabled && (
							<IonButton
								fill="clear"
								size="small"
								color="danger"
								onClick={handleRemove}
								className="image-upload-remove-btn"
							>
								<IonIcon slot="icon-only" icon={trash} />
							</IonButton>
						)}
					</>
				) : (
					<div className="image-upload-placeholder">
						<IonIcon
							icon={isDragging ? cloudUpload : imageIcon}
							className={`image-upload-icon ${isDragging ? 'dragging' : ''}`}
						/>
						<p className="image-upload-text-primary">
							{isDragging ? 'Drop image here' : 'Drag & drop an image here'}
						</p>
						<p className="image-upload-text-secondary">or click to browse</p>
					</div>
				)}
			</button>

			{/* Error message */}
			{error && <div className="image-upload-error">{error}</div>}

			{/* Help text */}
			{!error && (
				<p className="image-upload-help">
					Supported formats: {acceptedTypes.map((type) => type.split('/')[1].toUpperCase()).join(', ')}{' '}
					(max {(maxSize / (1024 * 1024)).toFixed(1)}MB)
				</p>
			)}
		</div>
	);
};
