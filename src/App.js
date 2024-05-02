import React, { useContext } from 'react';
import AppProvider from './state/store';
import { StepsForm } from './components';

const App = () => {
  return (
    <AppProvider>
      <div className="h-screen">
        <StepsForm />
      </div>
    </AppProvider>
  );
}

export default App;
