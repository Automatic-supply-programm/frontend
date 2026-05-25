import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { store } from './app/store';
import { router } from './router';
import { UserLoader } from './pages/LoginPage';
import './index.css';

dayjs.locale('ru');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <AntApp>
          <UserLoader>
            <RouterProvider router={router} />
          </UserLoader>
        </AntApp>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
