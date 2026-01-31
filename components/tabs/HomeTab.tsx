'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header, PageContainer } from '@/components/layout';
import { SummaryBar, TransactionList, EditTransactionSheet } from '@/components/transactions';
import { MonthPicker, WalletSelector } from '@/components/common';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useTransactionStore, useCategoryStore, useWalletStore, useAlertSettingsStore } from '@/lib/stores';
import { TransactionWithCategory } from '@/types';

export function HomeTab() {
  // Edit sheet state
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Wallet store
  const wallets = useWalletStore((s) => s.wallets);
  const loadWallets = useWalletStore((s) => s.loadWallets);
  const walletInitialized = useWalletStore((s) => s.isInitialized);

  // Transaction store selectors
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const setSelectedMonth = useTransactionStore((s) => s.setSelectedMonth);
  const selectedDay = useTransactionStore((s) => s.selectedDay);
  const setSelectedDay = useTransactionStore((s) => s.setSelectedDay);
  const selectedWalletId = useTransactionStore((s) => s.selectedWalletId);
  const setSelectedWalletId = useTransactionStore((s) => s.setSelectedWalletId);
  const newTransactionIds = useTransactionStore((s) => s.newTransactionIds);
  const dailySummaries = useTransactionStore((s) => s.dailySummaries);
  const monthlySummary = useTransactionStore((s) => s.monthlySummary);
  const walletBalances = useTransactionStore((s) => s.walletBalances);
  const toastVisible = useTransactionStore((s) => s.toastVisible);
  const toastType = useTransactionStore((s) => s.toastType);
  const getTransactionById = useTransactionStore((s) => s.getTransactionById);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  // Category store
  const expenseCategories = useCategoryStore((s) => s.expenseCategories);
  const incomeCategories = useCategoryStore((s) => s.incomeCategories);

  // Alert settings store
  const isMonthlyTargetEnabled = useAlertSettingsStore((s) => s.isMonthlyTargetEnabled);
  const monthlyExpenseTarget = useAlertSettingsStore((s) => s.monthlyExpenseTarget);
  const isCategoryLimitsEnabled = useAlertSettingsStore((s) => s.isCategoryLimitsEnabled);
  const categoryLimits = useAlertSettingsStore((s) => s.categoryLimits);

  // Load wallets on mount
  useEffect(() => {
    if (!walletInitialized) {
      loadWallets();
    }
  }, [walletInitialized, loadWallets]);

  // Get selected wallet info
  const selectedWallet = selectedWalletId
    ? wallets.find((w) => w.id === selectedWalletId)
    : null;

  // Get current wallet balance from transactions
  const currentWalletBalance = selectedWalletId
    ? walletBalances[selectedWalletId]?.balance || 0
    : Object.values(walletBalances).reduce((sum, wb) => sum + wb.balance, 0);

  // Compute alert messages
  const alerts = useMemo(() => {
    const result: { variant: 'warning' | 'danger'; title: string; description?: string }[] = [];

    // Monthly expense target alert
    if (isMonthlyTargetEnabled && monthlyExpenseTarget !== null && monthlyExpenseTarget > 0) {
      const expense = monthlySummary.expense;
      const ratio = expense / monthlyExpenseTarget;
      if (ratio >= 1) {
        result.push({
          variant: 'danger',
          title: `รายจ่ายเกินเป้าหมาย!`,
          description: `${expense.toLocaleString('th-TH')} / ${monthlyExpenseTarget.toLocaleString('th-TH')} บาท (${Math.round(ratio * 100)}%)`,
        });
      } else if (ratio >= 0.9) {
        result.push({
          variant: 'warning',
          title: `รายจ่ายใกล้ถึงเป้าหมาย`,
          description: `${expense.toLocaleString('th-TH')} / ${monthlyExpenseTarget.toLocaleString('th-TH')} บาท (${Math.round(ratio * 100)}%)`,
        });
      }
    }

    // Category limits alerts
    if (isCategoryLimitsEnabled && categoryLimits.length > 0) {
      // Flatten all transactions from daily summaries for category grouping
      const allTransactions = dailySummaries.flatMap((ds) => ds.transactions);

      for (const cl of categoryLimits) {
        const categoryExpense = allTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === cl.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        if (categoryExpense <= 0) continue;

        const cat = expenseCategories.find((c) => c.id === cl.categoryId);
        const catName = cat ? `${cat.icon || ''} ${cat.name}` : 'หมวดหมู่';
        const ratio = categoryExpense / cl.limit;

        if (ratio >= 1) {
          result.push({
            variant: 'danger',
            title: `${catName} เกินลิมิต!`,
            description: `${categoryExpense.toLocaleString('th-TH')} / ${cl.limit.toLocaleString('th-TH')} บาท (${Math.round(ratio * 100)}%)`,
          });
        } else if (ratio >= 0.9) {
          result.push({
            variant: 'warning',
            title: `${catName} ใกล้ถึงลิมิต`,
            description: `${categoryExpense.toLocaleString('th-TH')} / ${cl.limit.toLocaleString('th-TH')} บาท (${Math.round(ratio * 100)}%)`,
          });
        }
      }
    }

    return result;
  }, [
    isMonthlyTargetEnabled, monthlyExpenseTarget, monthlySummary.expense,
    isCategoryLimitsEnabled, categoryLimits, dailySummaries, expenseCategories,
  ]);

  const handleTransactionClick = (id: string) => {
    const transaction = getTransactionById(id);
    if (transaction) {
      setEditingTransaction(transaction);
      setEditSheetOpen(true);
    }
  };

  const handleEditSheetChange = (open: boolean) => {
    setEditSheetOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  return (
    <>
      <Header
        // rightAction={
        //   <div className="flex items-center gap-1">
        //     <Button variant="ghost" size="icon-sm" className="rounded-full">
        //       <Calendar className="size-5" />
        //     </Button>
        //   </div>
        // }
        leftAction={
          <WalletSelector
            wallets={wallets}
            selectedWalletId={selectedWalletId}
            walletBalances={walletBalances}
            onSelect={setSelectedWalletId}
          />
        }
      />

      <PageContainer className="pt-2">
        {/* Month Picker */}
        <div className="mb-2">
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
          />
        </div>

        {/* Summary - Combined Wallet & Monthly Summary */}
        <SummaryBar
          income={monthlySummary.income}
          expense={monthlySummary.expense}
          wallet={selectedWallet}
          walletBalance={currentWalletBalance}
          className="mb-2"
        />

        {/* Expense Alert Banners */}
        {alerts.length > 0 && (
          <div className="mb-3 space-y-2">
            {alerts.map((alert, i) => (
              <AlertBanner
                key={i}
                variant={alert.variant}
                title={alert.title}
                description={alert.description}
              />
            ))}
          </div>
        )}

        {/* Transaction List */}
        <TransactionList
          dailySummaries={dailySummaries}
          onTransactionClick={handleTransactionClick}
          newTransactionIds={newTransactionIds}
        />
      </PageContainer>

      {/* Edit Transaction Sheet */}
      <EditTransactionSheet
        transaction={editingTransaction}
        open={editSheetOpen}
        onOpenChange={handleEditSheetChange}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
      />

      {/* Success Toast */}
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out
          ${toastVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
      >
        <div
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md
            ${toastType === 'income'
              ? 'bg-income/90 text-white'
              : 'bg-income/90 text-white'
            }`}
        >
          <svg
            className="size-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" className="opacity-70" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l3 3 5-5" />
          </svg>
          <span className="font-medium">บันทึกสำเร็จ!</span>
        </div>
      </div>
    </>
  );
}
