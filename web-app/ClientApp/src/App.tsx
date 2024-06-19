import React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { FetchData } from './components/FetchData';
import { Counter } from './components/Counter';
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