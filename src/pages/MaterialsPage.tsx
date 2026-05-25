import { useState } from 'react';
import { Typography } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetMaterialsQuery } from '../features/materials/materialsApi';
import MaterialsTable from '../components/materials/MaterialsTable';
import MaterialCardModal from '../components/materials/MaterialCardModal';
import MaterialForm from '../components/materials/MaterialForm';

export default function MaterialsPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useGetMaterialsQuery({
    archived: showArchived || undefined,
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
  });

  // Берём объект из актуального списка — обновляется автоматически после любой мутации
  const selectedMaterial = data.find((m) => m.id === selectedId) ?? null;

  if (!user) return null;
  const canAdd = user.role === 'ADMIN' || user.role === 'WORKER';

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 20 }}>Склад</Typography.Title>

      <MaterialsTable
        data={data}
        loading={isLoading}
        onRowClick={(m) => setSelectedId(m.id)}
        onAdd={() => setShowForm(true)}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={category}
        onCategoryChange={setCategory}
        statusFilter={status}
        onStatusChange={setStatus}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        canAdd={canAdd}
        onReset={() => { setSearch(''); setCategory(''); setStatus(''); setShowArchived(false); }}
      />

      <MaterialCardModal
        material={selectedMaterial}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        userRole={user.role}
      />

      {canAdd && (
        <MaterialForm open={showForm} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
