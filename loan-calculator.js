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

    let syncingField = null; // Tracks the field being synced ("principal" or "collateral")

    // Format numbers with commas and two decimal places
    function formatNumber(value) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Parse raw numbers from formatted input values
    function parseNumber(value) {
        return parseFloat(value.replace(/,/g, "")) || 0; // Remove commas and convert to float
    }

    // Calculate BTC Collateral from Loan Principal
    function calculateCollateral(principal, ltv) {
        return principal / (btcPrice * ltv);
    }

    // Calculate Loan Principal from BTC Collateral
    function calculatePrincipal(collateral, ltv) {
        return collateral * btcPrice * ltv;
    }

    // Update calculated results (e.g., 30-Day Payment, Final Payment, etc.)
    function updateResults(principal) {
        const ltv = parseFloat(ltvSlider.value) / 100;

        if (principal > 0) {
            const thirtyDayPayment = principal * (interestRate / 365) * 30;
            const financeCharge = principal * effectiveRate;
            const finalPayment = principal + financeCharge;
            const originationFee = principal * 0.02;
            const marginCallPrice = principal / ((principal / (btcPrice * ltv)) * 1.5);
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

    // Sync BTC Collateral when Loan Principal is edited
    principalInput.addEventListener("input", () => {
        if (syncingField === "collateral") return; // Prevent cyclic updates
        syncingField = "principal";

        const principal = parseNumber(principalInput.value); // Parse raw value
        const ltv = parseFloat(ltvSlider.value) / 100;

        if (principal > 0) {
            const btcCollateral = calculateCollateral(principal, ltv);
            btcCollateralInput.value = btcCollateral.toFixed(6); // Raw numeric value for input
        }

        updateResults(principal);
        syncingField = null; // Clear the syncing field
    });

    // Sync Loan Principal when BTC Collateral is edited
    btcCollateralInput.addEventListener("input", () => {
        if (syncingField === "principal") return; // Prevent cyclic updates
        syncingField = "collateral";

        const btcCollateral = parseNumber(btcCollateralInput.value); // Parse raw value
        const ltv = parseFloat(ltvSlider.value) / 100;

        if (btcCollateral > 0) {
            const principal = calculatePrincipal(btcCollateral, ltv);
            principalInput.value = principal.toFixed(2); // Raw numeric value for input
            updateResults(principal);
        }

        syncingField = null; // Clear the syncing field
    });

    // Format inputs on blur (when user leaves the field)
    principalInput.addEventListener("blur", () => {
        const principal = parseNumber(principalInput.value);
        principalInput.value = formatNumber(principal); // Format with commas
    });

    btcCollateralInput.addEventListener("blur", () => {
        const btcCollateral = parseNumber(btcCollateralInput.value);
        btcCollateralInput.value = formatNumber(btcCollateral); // Format with commas
    });

    // Handle LTV slider updates
    ltvSlider.addEventListener("input", (e) => {
        ltvValueDisplay.textContent = e.target.value + "%";

        const principal = parseNumber(principalInput.value) || 0;
        if (principal > 0) {
            updateResults(principal); // Recalculate all results with the new LTV
        }
    });

    // Initialize results on page load
    updateResults(parseNumber(principalInput.value) || 0);
});
