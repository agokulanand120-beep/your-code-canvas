import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { Calculator, RotateCcw } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const num = (v: string) => {
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};

export default function EMICalculatorDialog({ open, onOpenChange }: Props) {
  const [price, setPrice] = useState("");
  const [down, setDown] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");

  const result = useMemo(() => {
    const p = num(price);
    const d = num(down);
    const r = num(rate);
    const t = num(tenure);
    const principal = Math.max(p - d, 0);
    const calcEmi = (amt: number) => {
      if (!amt || !t) return 0;
      const mRate = r / 12 / 100;
      return mRate === 0
        ? amt / t
        : (amt * mRate * Math.pow(1 + mRate, t)) / (Math.pow(1 + mRate, t) - 1);
    };
    if (!principal || !t) {
      return { principal, emi: 0, totalPayable: 0, interest: 0, principalPct: 0, interestPct: 0, interestNoDown: 0, savedInterest: 0, savedPct: 0 };
    }
    const emi = calcEmi(principal);
    const totalPayable = emi * t;
    const interest = totalPayable - principal;
    const principalPct = totalPayable ? (principal / totalPayable) * 100 : 0;
    const interestPct = 100 - principalPct;
    // What interest would be with NO down payment (for "savings" comparison)
    const interestNoDown = p > 0 ? calcEmi(p) * t - p : interest;
    const savedInterest = Math.max(interestNoDown - interest, 0);
    const savedPct = interestNoDown > 0 ? (savedInterest / interestNoDown) * 100 : 0;
    return { principal, emi, totalPayable, interest, principalPct, interestPct, interestNoDown, savedInterest, savedPct };
  }, [price, down, rate, tenure]);

  const reset = () => {
    setPrice("");
    setDown("");
    setRate("");
    setTenure("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-card">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            EMI Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Loan Details */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loan Details
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Vehicle Price</Label>
                <span className="text-xs text-muted-foreground">{price ? formatCurrency(num(price)) : "—"}</span>
              </div>
              <Input
                inputMode="decimal"
                placeholder="e.g. 500000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Slider
                value={[Math.min(num(price), 5000000)]}
                onValueChange={(v) => setPrice(String(v[0]))}
                min={0}
                max={5000000}
                step={10000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Down Payment</Label>
                <span className="text-xs text-muted-foreground">{down ? formatCurrency(num(down)) : "—"}</span>
              </div>
              <Input
                inputMode="decimal"
                placeholder="e.g. 100000"
                value={down}
                onChange={(e) => setDown(e.target.value)}
              />
              <Slider
                value={[Math.min(num(down), num(price) || 5000000)]}
                onValueChange={(v) => setDown(String(v[0]))}
                min={0}
                max={Math.max(num(price), 5000000)}
                step={5000}
              />
            </div>
          </div>

          <Separator />

          {/* Tenure & Rate */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenure & Interest
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Interest Rate (% p.a.)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 10.5"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <Slider
                  value={[Math.min(num(rate), 24)]}
                  onValueChange={(v) => setRate(String(v[0]))}
                  min={0}
                  max={24}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tenure (months)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="e.g. 36"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                />
                <Slider
                  value={[Math.min(num(tenure), 84)]}
                  onValueChange={(v) => setTenure(String(v[0]))}
                  min={0}
                  max={84}
                  step={1}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Result */}
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly EMI</div>
              <div className="text-3xl font-bold text-primary tabular-nums">
                {result.emi > 0 ? formatCurrency(Math.round(result.emi)) : "—"}
              </div>
            </div>

            {result.emi > 0 && (
              <>
                {/* Breakdown bar */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${result.principalPct}%` }}
                    title={`Principal ${result.principalPct.toFixed(0)}%`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${result.interestPct}%` }}
                    title={`Interest ${result.interestPct.toFixed(0)}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Financed</div>
                    <div className="text-sm font-semibold mt-0.5">{formatCurrency(result.principal)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Interest</div>
                    <div className="text-sm font-semibold text-amber-600 mt-0.5">
                      {formatCurrency(Math.round(result.interest))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Payable</div>
                    <div className="text-sm font-semibold mt-0.5">
                      {formatCurrency(Math.round(result.totalPayable))}
                    </div>
                  </div>
                </div>

                {result.savedInterest > 0 && num(down) > 0 && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300">
                      Down payment saves you
                    </div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {formatCurrency(Math.round(result.savedInterest))}
                      <span className="text-[10px] font-normal ml-1">({result.savedPct.toFixed(1)}% interest)</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
