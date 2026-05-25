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
  const [warehouse, setWarehouse] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useGetMaterialsQuery({
    archived: showArchived || undefined,
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
    warehouseId: warehouse || undefined,
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
        onRowClick={(m) => { setEditMode(false); setSelectedId(m.id); }}
        onAdd={() => setShowForm(true)}
        onEdit={canAdd ? (m) => { setEditMode(true); setSelectedId(m.id); } : undefined}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={category}
        onCategoryChange={setCategory}
        statusFilter={status}
        onStatusChange={setStatus}
        warehouseFilter={warehouse}
        onWarehouseChange={setWarehouse}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        canAdd={canAdd}
        onReset={() => { setSearch(''); setCategory(''); setStatus(''); setWarehouse(''); setShowArchived(false); }}
      />

      <MaterialCardModal
        material={selectedMaterial}
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setEditMode(false); }}
        userRole={user.role}
        startEditing={editMode}
      />

      {canAdd && (
        <MaterialForm open={showForm} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
