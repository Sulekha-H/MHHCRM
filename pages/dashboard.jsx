import { requireAuth } from '../lib/requireAuth';
import Dashboard from '@/components/dashboard/Dashboard';

export const getServerSideProps = requireAuth;

export default function DashboardPage({ session}) {
  return <Dashboard session={session} />;
}
