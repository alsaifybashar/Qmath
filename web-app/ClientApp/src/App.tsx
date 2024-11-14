import React from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import AppRoutes from './AppRoutes';
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { AuthProvider } from "./contexts/AuthContext";

import './custom.css'

const App = () => {
    return (
      <DatabaseProvider>
        <AuthProvider>
        <Layout>
          <Routes>
            {/* Auto populate routes */}
            {AppRoutes.map(route => 
              <Route {...route} />
            )}
          </Routes>
        </Layout>
        </AuthProvider>
      </DatabaseProvider>
    );
}

export default App;