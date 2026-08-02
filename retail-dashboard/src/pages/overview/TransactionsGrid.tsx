import { AgGridReact } from 'ag-grid-react';
import type { Transaction } from '@/types/domain';
import { ModuleRegistry, AllCommunityModule, themeAlpine } from 'ag-grid-community';

interface Props {
    rows: Transaction[];
}

ModuleRegistry.registerModules([
    AllCommunityModule,
]);

export default function TransactionsGrid({ rows }: Props) {
    return (
        <div
            style={{ height: 420 }}>
            <AgGridReact<Transaction>
                theme={themeAlpine}
                rowData={rows}
                columnDefs={[
                    { field: 'id', headerName: 'ID', width: 220 },
                    { field: 'timestamp', headerName: 'Time', flex: 1 },
                    { field: 'amount', headerName: 'Amount', sortable: false, width: 120 },
                    { field: 'items', headerName: 'Items', width: 100 },
                    {
                        field: 'paymentMethod',
                        headerName: 'Payment',
                        width: 130,
                        cellRenderer: (p: any) => {
                            const colors: Record<string, string> = { card: '#2f54eb', mobile: '#08979c', cash: '#d48806' };
                            return <span style={{ color: colors[p.value] }}>{p.value}</span>;
                        },
                    },
                ]}
                defaultColDef={{ sortable: true, resizable: true }}
            />
        </div>
    );
}