import React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import AppRoutes from './AppRoutes';

import './custom.css'

const App = () => {
    return (
      <Layout>
        <Routes>
          {/* Auto populate routes */}
          {AppRoutes.map(route => 
            <Route {...route} />
          )}
        </Routes>
      </Layout>
    );
}

export default App;