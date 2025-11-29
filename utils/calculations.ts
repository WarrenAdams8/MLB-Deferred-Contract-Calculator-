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
  cbtValue: number; // The AAV (Tax Hit) for this year
  payoutReceived: number; // Cash actually received this year (salary + deferred payouts)
  cumulativeReceived: number; // Running total of cash received
}

export interface CalculationResult {
  nominalAAV: number;
  cbtAAV: number;
  totalPresentValue: number;
  yearlyBreakdown: YearlyData[];
  effectiveDiscount: number;
  escrowRequirement: number; // Amount needed to fund the deferred portion
}

export const calculateContract = (data: ContractData): CalculationResult => {
  const { totalValue, years, deferralAmount, deferralStartYear, payoutDuration, interestRate } = data;

  const yearlySalaryTotal = totalValue / years;
  const yearlyDeferral = deferralAmount / years;
  const yearlyCashSalary = yearlySalaryTotal - yearlyDeferral;

  // 1. Calculate Total Present Value of Deferred Money
  // We determine the PV of every deferred dollar and sum it up first.
  // According to the CBA, we calculate the AAV by taking the Total PV / Years.
  
  let totalDeferredPV = 0;
  
  // For Escrow calculation (Article XVI), the discount rate is 5% annually.
  // This is calculated separately from the CBT PV which uses the Federal Mid-Term Rate.
  let totalEscrowPV = 0;
  const ESCROW_DISCOUNT_RATE = 5.0;

  // Each year of service (1..years) earns a 'yearlyDeferral' amount.
  // That amount is typically paid out in equal installments over the payout period.
  // We must discount those specific future installments back to the specific earning year.
  
  for (let earningYear = 1; earningYear <= years; earningYear++) {
    // The amount earned in this specific year that is deferred.
    // We assume this 'yearlyDeferral' is paid out evenly over the payoutDuration years.
    const installmentPerPayoutYear = yearlyDeferral / payoutDuration;

    for (let p = 0; p < payoutDuration; p++) {
      const payoutYear = years + deferralStartYear + p;
      const timeDiff = payoutYear - earningYear; // Discount period
      
      // CBT PV calculation (using input interest rate)
      totalDeferredPV += calculatePresentValue(installmentPerPayoutYear, timeDiff, interestRate);
      
      // Escrow PV calculation (using fixed 5% rate per Article XVI)
      // Note: The CBA says funding must happen by the "second July 1 following the championship season".
      // This simplifies to roughly 2 years after the earning year for full funding.
      // However, for simplicity in this calculator, we calculate the PV at the time earned to show the magnitude.
      totalEscrowPV += calculatePresentValue(installmentPerPayoutYear, timeDiff, ESCROW_DISCOUNT_RATE);
    }
  }

  const totalCashValue = yearlyCashSalary * years; // Cash paid in year earned is not discounted for CBT purposes
  const totalPresentValue = totalCashValue + totalDeferredPV;
  
  // The CBT Hit is the Average Annual Value of the Total PV
  const cbtAAV = totalPresentValue / years;
  const nominalAAV = totalValue / years;

  // 2. Build Yearly Data
  const yearlyBreakdown: YearlyData[] = [];
  const totalTimeline = Math.max(years, years + deferralStartYear + payoutDuration);
  
  // Total amount deferred divided by payout years = annual check during retirement
  const yearlyDeferredPayoutCheck = deferralAmount / payoutDuration;

  let runningTotal = 0;

  for (let i = 1; i <= totalTimeline; i++) {
    let payoutReceived = 0;

    // Cash Salary Received (During playing years)
    if (i <= years) {
      payoutReceived += yearlyCashSalary;
    }
    
    // Deferred Payouts Received (During retirement years)
    const payoutStartIndex = years + deferralStartYear; 
    const payoutEndIndex = payoutStartIndex + payoutDuration - 1;

    if (i >= payoutStartIndex && i <= payoutEndIndex) {
      payoutReceived += yearlyDeferredPayoutCheck;
    }

    runningTotal += payoutReceived;

    yearlyBreakdown.push({
      year: i,
      label: i <= years ? `Year ${i}` : `Deferred ${i - years}`,
      cashPay: i <= years ? yearlyCashSalary : 0,
      deferredEarned: i <= years ? yearlyDeferral : 0,
      // CBT Hit is spread evenly (AAV) across guaranteed years
      cbtValue: i <= years ? cbtAAV : 0,
      payoutReceived,
      cumulativeReceived: runningTotal
    });
  }
  
  // Effective discount percentage
  const effectiveDiscount = ((nominalAAV - cbtAAV) / nominalAAV) * 100;

  return {
    nominalAAV,
    cbtAAV,
    totalPresentValue,
    yearlyBreakdown,
    effectiveDiscount,
    escrowRequirement: totalEscrowPV // This represents the total PV that needs to be funded over the life of the deal
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