// CategorySidebar - Vertical category list for tablet view

import { IonItem, IonLabel, IonList } from '@ionic/react';
import type React from 'react';
import type { ProductCategory } from '@/types';

interface CategorySidebarProps {
	categories: ProductCategory[];
	selectedId: string | null;
	onSelect: (categoryId: string | null) => void;
	showAll?: boolean;
	allLabel?: string;
	className?: string;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
	categories,
	selectedId,
	onSelect,
	showAll = true,
	allLabel = 'All',
	className = '',
}) => {
	return (
		<IonList className={className} lines="none">
			{showAll && (
				<IonItem
					button
					detail={false}
					onClick={() => onSelect(null)}
					color={selectedId === null ? 'primary' : undefined}
				>
					<IonLabel>{allLabel}</IonLabel>
				</IonItem>
			)}

			{categories.map((category) => (
				<IonItem
					key={category.id}
					button
					detail={false}
					onClick={() => onSelect(category.id)}
					color={selectedId === category.id ? 'primary' : undefined}
				>
					<IonLabel>{category.description || category.name}</IonLabel>
				</IonItem>
			))}
		</IonList>
	);
};

export default CategorySidebar;
