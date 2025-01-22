document.addEventListener("DOMContentLoaded", () => {
    const principalInput = document.getElementById("loan-principal");
    const btcCollateralInput = document.getElementById("btc-collateral-input");
    const ltvSlider = document.getElementById("ltv-slider");
    const ltvValueDisplay = document.getElementById("ltv-value");
    const paymentDisplay = document.getElementById("payment");
    const finalPaymentDisplay = document.getElementById("final-payment");
    const originationFeeDisplay = document.getElementById("origination-fee");
    const financeChargeDisplay = document.getElementById("finance-charge");
    const marginCallDisplay = document.getElementById("margin-call");
    const liquidationPriceDisplay = document.getElementById("liquidation-price");

    const interestRate = 0.14; // Annual interest rate
    const effectiveRate = 0.15808; // Finance charge effective rate
    const btcPrice = 102119.3; // Static BTC price for calculations

    let lastUpdated = ""; // Tracks the last field updated ("principal" or "collateral")

    // Format numbers with commas and two decimal places
    function formatNumber(value) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Update all calculated results
    function updateResults() {
        const ltv = parseFloat(ltvSlider.value) / 100;
        const principal = parseFloat(principalInput.value) || 0;
        const btcCollateral = parseFloat(btcCollateralInput.value) || 0;

        if (lastUpdated === "principal" && principal > 0) {
            // Calculate BTC Collateral from Loan Principal
            const calculatedBtcCollateral = principal / (btcPrice * ltv);
            btcCollateralInput.value = formatNumber(calculatedBtcCollateral);
        }

        if (lastUpdated === "collateral" && btcCollateral > 0) {
            // Calculate Loan Principal from BTC Collateral
            const calculatedPrincipal = btcCollateral * btcPrice * ltv;
            principalInput.value = formatNumber(calculatedPrincipal);
        }

        if (principal > 0) {
            // 30-Day Payment (Interest Only)
            const thirtyDayPayment = principal * (interestRate / 365) * 30;

            // Finance Charge
            const financeCharge = principal * effectiveRate;

            // Final Payment
            const finalPayment = principal + financeCharge;

            // Origination Fee
            const originationFee = principal * 0.02;

            // Estimated Margin Call Price (150% CTP)
            const marginCallPrice = principal / ((principal / (btcPrice * ltv)) * 1.5);

            // Estimated Liquidation Price (110% CTP)
            const liquidationPrice = principal / ((principal / (btcPrice * ltv)) * 1.1);

            // Update displayed values
            paymentDisplay.textContent = "$" + formatNumber(thirtyDayPayment);
            finalPaymentDisplay.textContent = "$" + formatNumber(finalPayment);
            originationFeeDisplay.textContent = "$" + formatNumber(originationFee);
            financeChargeDisplay.textContent = "$" + formatNumber(financeCharge);
            marginCallDisplay.textContent = "$" + formatNumber(marginCallPrice);
            liquidationPriceDisplay.textContent = "$" + formatNumber(liquidationPrice);
        }
    }

    // Handle LTV slider updates
    function updateLTVValue(value) {
        ltvValueDisplay.textContent = value + "%";
        updateResults();
    }

    // Event listeners for manual updates
    principalInput.addEventListener("input", () => {
        lastUpdated = "principal"; // Mark Loan Principal as last updated
        updateResults();
    });

    btcCollateralInput.addEventListener("input", () => {
        lastUpdated = "collateral"; // Mark BTC Collateral as last updated
        updateResults();
    });

    ltvSlider.addEventListener("input", (e) => updateLTVValue(e.target.value));

    // Initial results update
    updateResults();
});
