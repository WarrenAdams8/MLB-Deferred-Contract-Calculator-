/**
 * Calculates the Present Value (PV) of a future payment.
 * Formula based on MLB CBA Article XXIII(E)(6) for Deferred Compensation.
 * 
 * @param futureValue The amount to be paid in the future.
 * @param years The number of years from the earned date (June 30 of playing season) to payment date.
 * @param rate The Imputed Loan Interest Rate (Federal Mid-Term Rate).
 */
export const calculatePresentValue = (futureValue: number, years: number, rate: number): number => {
  // PV = FV / (1 + r)^n
  // Rate is input as a percentage (e.g., 4.4), so divide by 100.
  return futureValue / Math.pow(1 + (rate / 100), years);
};

export interface ContractData {
  totalValue: number;
  years: number;
  deferralAmount: number;
  deferralStartYear: number; // Years after contract ends that payments begin
  payoutDuration: number; // How many years the deferred money is paid out over
  interestRate: number; // Federal Mid-Term Rate
}

export interface YearlyData {
  year: number;
  label: string;
  cashPay: number;
  deferredEarned: number; // Nominal value earned this year but deferred
  cbtValue: number; // The PV of the total earned (cash + deferred) for this year
  payoutReceived: number; // Cash actually received this year (salary + deferred payouts)
}

export interface CalculationResult {
  nominalAAV: number;
  cbtAAV: number;
  totalPresentValue: number;
  yearlyBreakdown: YearlyData[];
  effectiveDiscount: number;
}

export const calculateContract = (data: ContractData): CalculationResult => {
  const { totalValue, years, deferralAmount, deferralStartYear, payoutDuration, interestRate } = data;

  const yearlySalaryTotal = totalValue / years;
  const yearlyDeferral = deferralAmount / years;
  const yearlyCashSalary = yearlySalaryTotal - yearlyDeferral;

  let totalCBTValue = 0;
  const yearlyBreakdown: YearlyData[] = [];

  // The deferred money is usually paid out in equal installments over the payoutDuration
  const totalDeferred = deferralAmount;
  const yearlyDeferredPayout = totalDeferred / payoutDuration;

  // We need to map out a timeline that covers the playing contract + the payout period
  // We assume deferral payments start 'deferralStartYear' years AFTER the contract ends.
  // Note: If deferralStartYear is 1, it means 1 year after the contract ends.
  
  const totalTimeline = Math.max(years, years + deferralStartYear + payoutDuration);

  for (let i = 1; i <= totalTimeline; i++) {
    let cashPay = 0;
    let deferredEarned = 0;
    let cbtHit = 0;
    let payoutReceived = 0;

    // 1. Determine what is EARNED in this year (Playing Phase)
    if (i <= years) {
      cashPay = yearlyCashSalary;
      deferredEarned = yearlyDeferral;

      // Calculate CBT Hit for this specific year
      // CBT = Cash Paid + PV of Deferred Money Earned This Year
      
      // When is this specific year's deferred money paid?
      // In standard structures (like Ohtani), the deferred money earned in Year X 
      // is paid out in installments starting after the contract.
      // For simplicity in this model, we treat the "pot" of deferred money as being filled equally each playing year,
      // and emptying equally during the payout years. 
      
      // We need to discount each future installment back to THIS year (Year i).
      // The payout period starts at year: years + deferralStartYear
      
      let presentValueOfDeferredStream = 0;
      
      // This specific year's deferred earnings (yearlyDeferral) are technically paid out 
      // as a slice of the total payout stream. 
      // To be precise: We attribute 1/Nth of every future check to this year's labor.
      // N = contract length.
      
      for (let p = 0; p < payoutDuration; p++) {
        const payoutYearIndex = years + deferralStartYear + p;
        // The payment amount happening in the future
        const paymentAmount = yearlyDeferredPayout; 
        
        // We only own 1/years of that future check
        const portionAttributedToThisYear = paymentAmount / years;
        
        // Time difference: Payout Year - Current Playing Year
        // Article XXIII says discount back to June 30 of the season earned.
        // We will assume payments happen July 1 for simplicity (whole years).
        const timeDiff = payoutYearIndex - i; 
        
        presentValueOfDeferredStream += calculatePresentValue(portionAttributedToThisYear, timeDiff, interestRate);
      }

      cbtHit = cashPay + presentValueOfDeferredStream;
      totalCBTValue += cbtHit;
    }

    // 2. Determine what is RECEIVED in this year (Payout Phase)
    if (i <= years) {
      payoutReceived += yearlyCashSalary;
    }
    
    const payoutStartIndex = years + deferralStartYear; // 1-based index
    const payoutEndIndex = payoutStartIndex + payoutDuration - 1;

    if (i >= payoutStartIndex && i <= payoutEndIndex) {
      payoutReceived += yearlyDeferredPayout;
    }

    yearlyBreakdown.push({
      year: i,
      label: i <= years ? `Year ${i}` : `Deferred ${i - years}`,
      cashPay: i <= years ? yearlyCashSalary : 0,
      deferredEarned: i <= years ? yearlyDeferral : 0,
      cbtValue: i <= years ? cbtHit : 0,
      payoutReceived
    });
  }

  const nominalAAV = totalValue / years;
  const cbtAAV = totalCBTValue / years;
  
  // Effective discount percentage
  const effectiveDiscount = ((nominalAAV - cbtAAV) / nominalAAV) * 100;

  return {
    nominalAAV,
    cbtAAV,
    totalPresentValue: totalCBTValue, // Sum of PVs
    yearlyBreakdown,
    effectiveDiscount
  };
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMillions = (amount: number): string => {
  const millions = amount / 1_000_000;
  return `$${millions.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
};
