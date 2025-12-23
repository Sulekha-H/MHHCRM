import { requireAuth } from '../lib/requireAuth';

export const getServerSideProps = requireAuth;

export default function Home() {
  return <div>Dashboard</div>;
}
