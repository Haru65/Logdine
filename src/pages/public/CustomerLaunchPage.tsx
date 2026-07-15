import { Navigate } from 'react-router-dom';
import { getCustomerLaunchPath } from '@/pwa/customerLaunch';

export default function CustomerLaunchPage() {
  return <Navigate to={getCustomerLaunchPath() || '/dashboard'} replace />;
}
