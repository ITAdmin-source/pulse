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
      Statement {currentStatement} of {totalInBatch}
    </p>
  );
}
