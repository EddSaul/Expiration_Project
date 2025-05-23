import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './Components/LoginForm/LoginForm';
import Dashboard from './Components/Dashboard/Dashboard';
import CreateUsers from './Components/CreateUsers/CreateUsers';
import Categories from './Components/Categories/Categories';
import Brands from './Components/Brands/Brands';
import Trycreate from './Components/CreateUsers/Trycreate';
import ProtectedLayout from './ProtectedLayouts';
import { AuthLayout, PublicLayout } from './layouts';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <Login /> }
        ]
      },
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/createusers', element: <CreateUsers /> },
          { path: '/categories', element: <Categories /> },
          { path: '/brands', element: <Brands /> },
          { path: '/trycreate', element: <Trycreate /> }
        ]
      }
    ]
  }
]);
