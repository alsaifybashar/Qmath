import React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import AppRoutes from './AppRoutes';
import { DatabaseProvider } from "./contexts/DatabaseContext";
import './custom.css'

const App = () => {
    return (
      <DatabaseProvider>
        <Layout>
          <Routes>
            {/* Auto populate routes */}
            {AppRoutes.map(route => 
              <Route {...route} />
            )}
          </Routes>
        </Layout>
      </DatabaseProvider>
    );
}

export default App;