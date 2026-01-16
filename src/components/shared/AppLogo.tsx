import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface AppLogoProps {
	height?: string;
	showText?: boolean;
	className?: string;
	text?: string;
}

const LogoContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const LogoImage = styled.img<{ $height: string }>`
	height: ${(props) => props.$height};
	object-fit: contain;
`;

const LogoText = styled.span`
	color: ${designSystem.colors.brand.primary};
	font-weight: 700;
	font-family: 'Poppins', ${designSystem.typography.fontFamily.base};
    font-size: ${designSystem.typography.fontSize['2xl']};
`;

const AppLogo: React.FC<AppLogoProps> = ({
	height = '42px',
	showText = false,
	className = '',
	text = 'tindera',
}) => {
	return (
		<LogoContainer className={className}>
			<LogoImage src="/images/app-logo.png" alt="Tindera Logo" $height={height} />
			{showText && <LogoText>{text || 'tindera'}</LogoText>}
		</LogoContainer>
	);
};

export default AppLogo;
