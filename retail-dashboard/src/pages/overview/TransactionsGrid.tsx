import { AgGridReact } from 'ag-grid-react';
import type { PaymentMethod, Transaction } from '@/types/domain';
import { PAYMENT_METHOD_COLORS } from '@/types/domain';
import { themeAlpine } from 'ag-grid-community';

interface Props {
    rows: Transaction[];
}

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
                        cellRenderer: (p: { value: PaymentMethod }) => (
                            <span style={{ color: PAYMENT_METHOD_COLORS[p.value] }}>{p.value}</span>
                        ),
                    },
                ]}
                defaultColDef={{ sortable: true, resizable: true }}
            />
        </div>
    );
}