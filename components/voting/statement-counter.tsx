"use client";

interface StatementCounterProps {
  currentStatement: number;
  totalInBatch: number;
  className?: string;
}

export function StatementCounter({
  currentStatement,
  totalInBatch,
  className,
}: StatementCounterProps) {
  return (
    <p className={className}>
      הצהרה {currentStatement} מתוך {totalInBatch}
    </p>
  );
}
