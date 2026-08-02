import { useState } from 'react';
import type { Transaction } from '@/types/domain';

function LatestItem({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="latest-item" onClick={() => setOpen(!open)}>
      <div className="latest-item-head">
        <span className="amount">{tx.amount} €</span>
        <span className="when">{tx.timestamp.slice(11, 16)}</span>
      </div>
      {open && (
        <div className="latest-item-detail">
          {tx.items} item(s) · {tx.paymentMethod} · {tx.id}
        </div>
      )}
    </div>
  );
}

export default function LatestTransactions({ rows }: { rows: Transaction[] }) {
  return (
    <div className="latest-list">
      {rows.slice(0, 8).map((tx, index) => (
        <LatestItem key={index} tx={tx} />
      ))}
    </div>
  );
}