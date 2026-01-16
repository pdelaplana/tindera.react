// IonText2 - Reusable styled text component wrapping IonText

import { IonText } from '@ionic/react';
import type React from 'react';

export interface IonText2Props {
	children?: React.ReactNode;
	fontSize?: string | number;
	fontWeight?: string | number;
	color?: string;
	className?: string;
	style?: React.CSSProperties;
}

export const IonText2: React.FC<IonText2Props> = ({
	children,
	fontSize,
	fontWeight,
	color,
	className = '',
	style = {},
}) => {
	const combinedStyle: React.CSSProperties = {
		...style,
		...(fontSize && { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }),
		...(fontWeight && { fontWeight }),
	};

	return (
		<IonText color={color} className={className} style={combinedStyle}>
			{children}
		</IonText>
	);
};

export default IonText2;
