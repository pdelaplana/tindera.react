// POSLayout - Three-panel POS layout (categories | products | cart)

import type React from 'react';

interface POSLayoutProps {
	categories?: React.ReactNode;
	products: React.ReactNode;
	cart?: React.ReactNode;
	className?: string;
}

export const POSLayout: React.FC<POSLayoutProps> = ({
	categories,
	products,
	cart,
	className = '',
}) => {
	return (
		<div className={`pos-layout ${className}`.trim()}>
			{categories && <aside className="pos-layout__categories">{categories}</aside>}

			<main className="pos-layout__products">{products}</main>

			{cart && <aside className="pos-layout__cart">{cart}</aside>}
		</div>
	);
};

export default POSLayout;
