import { IonButton } from '@ionic/react';
import type React from 'react';
import styled from 'styled-components';
import AppLogo from './AppLogo';

const StyledButton = styled(IonButton)`
	--padding-start: 0;
	--padding-end: 0;
`;

const MenuButton: React.FC = () => {
	const openMenu = () => {
		const menu = document.querySelector('ion-menu');
		if (menu) {
			menu.open();
		}
	};

	return (
		<StyledButton fill="clear" onClick={openMenu}>
			<AppLogo height="32px" />
		</StyledButton>
	);
};

export default MenuButton;
