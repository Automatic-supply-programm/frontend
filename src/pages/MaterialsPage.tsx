import { useState } from 'react';
import { Typography } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGetMaterialsQuery } from '../features/materials/materialsApi';
import MaterialsTable from '../components/materials/MaterialsTable';
import MaterialCardModal from '../components/materials/MaterialCardModal';
import MaterialForm from '../components/materials/MaterialForm';

type ArchiveMode = 'active' | 'all' | 'only';

export default function MaterialsPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const includeArchived = archiveMode !== 'active';

  const { data: rawData = [], isLoading } = useGetMaterialsQuery({
    archived: includeArchived || undefined,
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
    warehouseId: warehouse || undefined,
  });

  const data = archiveMode === 'only' ? rawData.filter((m) => m.archived) : rawData;

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
        archiveMode={archiveMode}
        onArchiveModeChange={setArchiveMode}
        canAdd={canAdd}
        onReset={() => { setSearch(''); setCategory(''); setStatus(''); setWarehouse(''); setArchiveMode('active'); }}
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
