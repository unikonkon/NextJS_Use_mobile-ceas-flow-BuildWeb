'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  exportToTxt,
  type TxtExportProgress,
  type TxtExportData,
} from '@/lib/utils/txt-export';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderDown,
  Wallet,
  Tags,
  Info,
  Table,
  Calendar,
} from 'lucide-react';

function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  const getBarColor = () => {
    switch (status) {
      case 'complete':
        return 'bg-income';
      case 'error':
        return 'bg-expense';
      default:
        return 'bg-primary';
    }
  };

  const isActive = status !== 'complete' && status !== 'error' && status !== 'idle';

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
      {isActive && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
      <div
        className={cn(
          'h-full transition-all duration-500 ease-out',
          getBarColor()
        )}
        style={{
          width: `${progress}%`,
          boxShadow:
            status === 'complete' ? '0 0 12px var(--income)' : undefined,
        }}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/40 text-accent-foreground">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium leading-tight text-foreground">{label}</span>
        <span className="text-[11px] leading-snug text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

export function ExportTxtCard() {
  const [exportProgress, setExportProgress] = useState<TxtExportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const transactions = useTransactionStore((s) => s.transactions);
  const wallets = useWalletStore((s) => s.wallets);
  const { expenseCategories, incomeCategories } = useCategoryStore();

  const allCategories = [...expenseCategories, ...incomeCategories];
  const isExporting =
    exportProgress.status !== 'idle' &&
    exportProgress.status !== 'complete' &&
    exportProgress.status !== 'error';

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    const data: TxtExportData = {
      transactions,
      wallets,
      categories: allCategories,
    };

    try {
      await exportToTxt(data, setExportProgress);

      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    } catch {
      setTimeout(() => {
        setExportProgress({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    }
  }, [isExporting, transactions, wallets, allCategories]);

  const canExport = transactions.length > 0;
  const showProgress = exportProgress.status !== 'idle';

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-soft">
      {/* Decorative gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background:
            'radial-gradient(ellipse at top left, oklch(0.60 0.15 200) 0%, transparent 50%), radial-gradient(ellipse at bottom right, oklch(0.50 0.12 280) 0%, transparent 50%)',
        }}
      />

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-accent/10 to-primary/5">
            <FileText className="size-5.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ส่งออกข้อมูล TXT</h3>
            <p className="text-xs text-muted-foreground">
              ส่งออกข้อมูลเป็นไฟล์ .txt อ่านง่าย
            </p>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
            <FileText className="mb-1 size-3.5 text-primary" />
            <span className="text-base font-bold tabular-nums text-foreground">
              {transactions.length.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">รายการ</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
            <Wallet className="mb-1 size-3.5 text-income" />
            <span className="text-base font-bold tabular-nums text-foreground">
              {wallets.length}
            </span>
            <span className="text-[10px] text-muted-foreground">กระเป๋า</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-muted/30 p-2.5">
            <Tags className="mb-1 size-3.5 text-expense" />
            <span className="text-base font-bold tabular-nums text-foreground">
              {allCategories.length}
            </span>
            <span className="text-[10px] text-muted-foreground">หมวดหมู่</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4 space-y-3 rounded-xl bg-muted/20 p-3.5">
          <div className="flex items-center gap-1.5">
            <Info className="size-3.5 text-muted-foreground" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              ไฟล์ TXT จะประกอบด้วย
            </p>
          </div>
          <DetailRow
            icon={<Table className="size-3.5" />}
            label="ภาพรวมทั้งหมด"
            description="สรุปรายรับ-รายจ่ายรวม, ยอดคงเหลือ, จำนวนข้อมูล"
          />
          <DetailRow
            icon={<Wallet className="size-3.5" />}
            label="ข้อมูลกระเป๋าเงิน"
            description="รายชื่อกระเป๋า ประเภท ยอดเริ่มต้น และยอดปัจจุบัน"
          />
          <DetailRow
            icon={<Tags className="size-3.5" />}
            label="หมวดหมู่ทั้งหมด"
            description="รายรับและรายจ่าย แยกตามประเภท"
          />
          <DetailRow
            icon={<Calendar className="size-3.5" />}
            label="รายการธุรกรรมแยกตามกระเป๋า"
            description="วันที่ ประเภท หมวดหมู่ จำนวนเงิน หมายเหตุ"
          />
        </div>

        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-foreground/70">
            ไฟล์จะถูกดาวน์โหลดเป็น <span className="font-semibold text-primary">PayFlow_Export_วันที่.txt</span> สามารถเปิดด้วย Notepad, TextEdit หรือแอปอ่านข้อความทั่วไป
          </p>
        </div>

        {/* Progress Section */}
        {showProgress && (
          <div className="mb-4 animate-slide-up">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {exportProgress.status === 'complete' ? (
                  <CheckCircle2 className="size-4 text-income" />
                ) : exportProgress.status === 'error' ? (
                  <AlertCircle className="size-4 text-expense" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    exportProgress.status === 'complete' && 'text-income',
                    exportProgress.status === 'error' && 'text-expense'
                  )}
                >
                  {exportProgress.message}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {exportProgress.progress}%
              </span>
            </div>
            <ProgressBar
              progress={exportProgress.progress}
              status={exportProgress.status}
            />
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExport}
          disabled={!canExport || isExporting}
          className={cn(
            'relative w-full overflow-hidden rounded-xl py-3.5 font-medium',
            'transition-all duration-300',
            'disabled:cursor-not-allowed disabled:opacity-50',
            canExport && !isExporting
              ? 'bg-linear-to-r from-primary to-[oklch(0.50_0.15_280)] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {canExport && !isExporting && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          )}
          <span className="relative flex items-center justify-center gap-2">
            {isExporting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>กำลังส่งออก...</span>
              </>
            ) : exportProgress.status === 'complete' ? (
              <>
                <CheckCircle2 className="size-5" />
                <span>ส่งออกสำเร็จ!</span>
              </>
            ) : (
              <>
                <FolderDown className="size-5" />
                <span>ส่งออกไฟล์ TXT</span>
              </>
            )}
          </span>
        </button>

        {/* Helper text */}
        {!canExport && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            ไม่มีข้อมูลรายการให้ส่งออก
          </p>
        )}
      </CardContent>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </Card>
  );
}
