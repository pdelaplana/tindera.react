// Div - Styled div component that accepts both className and style props

import type React from 'react';
import styled from 'styled-components';

interface DivProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}

const StyledDiv = styled.div`
	/* Base styles can be added here if needed */
`;

/**
 * A flexible div component built with styled-components
 * that accepts both className and inline style props.
 *
 * @example
 * <Div className="ion-padding" style={{ marginTop: '20px' }}>
 *   Content here
 * </Div>
 */
export const Div: React.FC<DivProps> = ({ children, className, style, ...rest }) => {
	return (
		<StyledDiv className={className} style={style} {...rest}>
			{children}
		</StyledDiv>
	);
};
