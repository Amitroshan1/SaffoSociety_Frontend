import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './routes/AppRouter';

import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/glassmorphism.css';
import './styles/auth.css';
import './styles/panels.css';
import './styles/theme-light.css';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
