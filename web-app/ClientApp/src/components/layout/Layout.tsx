import React from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from '../layout/NavMenu';

interface Props {
  children?: React.ReactNode;
};

const Layout = ({ children }: Props) => {
    return (
        <div id="layout-root">
            <NavMenu />
            <Container>
                {children}
            </Container>
        </div>
    );
}

export { Layout };