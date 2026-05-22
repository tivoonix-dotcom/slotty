import { Outlet, useLocation } from 'react-router-dom';

/** Смена раздела кабинета без полноэкранной анимации загрузки. */
export function AdminRouteTransitionOutlet() {
  const location = useLocation();
  return <Outlet key={location.pathname} />;
}
