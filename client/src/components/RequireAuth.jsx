import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Context } from '../index';

function RequireAuth({ children }) {
  const location = useLocation();
  const context = useContext(Context);
  const userStore = context?.userStore;

  let storedUser = null;
  try {
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    storedUser = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    storedUser = null;
  }

  const currentUser = (userStore?.user?.id && userStore?.user?.name) ? userStore.user : storedUser;
  const isAuth = Boolean(userStore?.isAuth || (currentUser && currentUser.id && currentUser.name));

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default observer(RequireAuth);
