import React, { useEffect, useState } from 'react';
import { DataCatalogService, DataSourceEntry } from '@/services/DataCatalogService';

export const DataCatalog: React.FC = () => {
  const [items, setItems] = useState<DataSourceEntry[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await DataCatalogService.list();
      if (mounted) setItems(list);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <h3>Data Catalog</h3>
      {items.length === 0 && <div>No data sources registered</div>}
      {items.map(d => (
        <div key={d.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
          <div><b>{d.name}</b> ({d.type}) · Trust: {d.trust}</div>
          <div>Owner: {d.owner || 'n/a'} · Freshness: {d.freshness || 'unknown'} · Quality: {d.qualityScore ?? 'n/a'}</div>
          <div>Lineage: {(d.lineage || []).join(' → ') || 'n/a'}</div>
        </div>
      ))}
    </div>
  );
};
