import { useNavigate } from 'react-router-dom';
import { ResourceForm } from './Catalog';
import { useSession } from '../session';
import { Alert, Head } from '../ui';
export default function ProductForm() {
  const navigate = useNavigate(),
    { user } = useSession();
  return (
    <>
      <Head title="Add product" />
      {user.role === 'admin' ? (
        <ResourceForm kind="products" onSaved={() => navigate('/products')} />
      ) : (
        <Alert>Only an administrator can create products.</Alert>
      )}
    </>
  );
}
