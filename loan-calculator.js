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
    const btcPriceDisplay = document.getElementById("btc-price");
    const aprDisplay = document.getElementById("apr");
    const currencySelect = document.getElementById("currency-select");

    const interestRate = 0.14;
    let btcPriceUSD = 0;
    let btcChart;

    /***********************************************
     * 1) FETCH REAL-TIME BTC PRICE FROM BINANCE (WITH ERROR HANDLING)
     ***********************************************/
    async function fetchBTCPrice() {
        try {
            const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
            if (!response.ok) throw new Error("API Request Failed");
            
            const data = await response.json();
            btcPriceUSD = parseFloat(data.price);

            updateBTCPriceDisplay();
            updateResults();
            fetchBTCChart(); // Ensure chart updates when price updates
        } catch (error) {
            btcPriceDisplay.textContent = "⚠️ Error Fetching Price";
            console.error("BTC Price Fetch Error:", error);
        }
    }

    function updateBTCPriceDisplay() {
        btcPriceDisplay.textContent = btcPriceUSD > 0 ? `$${formatNumber(btcPriceUSD)}` : "⚠️ No Price Data";
    }

    function getBTCPrice() {
        return btcPriceUSD;
    }

    function formatNumber(value) {
        return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /***********************************************
     * 2) UPDATE CALCULATIONS (ENSURE VALUES ONLY APPEAR IF INPUTS ARE PROVIDED)
     ***********************************************/
    function updateResults() {
        const btcPrice = getBTCPrice();
        const ltv = parseFloat(ltvSlider.value);
        const liqLTVRate = Math.max(ltv + 10, 60);
        const mcLTV = (ltv + liqLTVRate) / 2;

        // Update LTV in UI
        ltvValueDisplay.textContent = `${ltv}%`;

        let principal = parseFloat(principalInput.value.replace(/,/g, "")) || 0;
        let collateral = parseFloat(btcCollateralInput.value.replace(/,/g, "")) || 0;

        if (principal <= 0 && collateral <= 0) {
            // 🔹 Reset all calculated fields if no input is provided
            paymentDisplay.textContent = "$0.00";
            finalPaymentDisplay.textContent = "$0.00";
            originationFeeDisplay.textContent = "$0.00";
            financeChargeDisplay.textContent = "$0.00";
            marginCallDisplay.textContent = "$0.00";
            liquidationPriceDisplay.textContent = "$0.00";
            aprDisplay.textContent = "0.00%";
            return;
        }

        if (principal > 0 && btcPrice > 0 && ltv > 0) {
            // 🔹 Recalculate BTC Collateral if Principal is entered
            collateral = principal / (btcPrice * (ltv / 100));
            btcCollateralInput.value = collateral.toFixed(6);
        } else if (collateral > 0 && btcPrice > 0 && ltv > 0) {
            // 🔹 Recalculate Loan Principal if Collateral is entered
            principal = collateral * btcPrice * (ltv / 100);
            principalInput.value = formatNumber(principal);
        }

        // 30-Day Payment (Interest Only)
        const thirtyDayPayment = principal * (interestRate / 365) * 30;

        // Origination Fee (2%)
        const originationFee = principal * 0.02;

        // Finance Charge (Annual Interest + Origination Fee)
        const financeCharge = (thirtyDayPayment * 12) + originationFee;

        // Final Payment (Principal + Last Month's Interest)
        const finalPayment = principal + thirtyDayPayment;

        // 🔹 Updated Margin Call Price
        const marginCallPrice = (ltv / mcLTV) * btcPrice;

        // 🔹 Updated Liquidation Price
        const liquidationPrice = (ltv / liqLTVRate) * btcPrice;

        // APR Calculation
        const apr = (financeCharge / principal) * 100;

        // Update UI
        paymentDisplay.textContent = `$${formatNumber(thirtyDayPayment)}`;
        finalPaymentDisplay.textContent = `$${formatNumber(finalPayment)}`;
        originationFeeDisplay.textContent = `$${formatNumber(originationFee)}`;
        financeChargeDisplay.textContent = `$${formatNumber(financeCharge)}`;
        marginCallDisplay.textContent = `$${formatNumber(marginCallPrice)}`;
        liquidationPriceDisplay.textContent = `$${formatNumber(liquidationPrice)}`;
        aprDisplay.textContent = formatNumber(apr) + "%";
    }

    /***********************************************
     * 3) BTC PRICE CHART (ENSURE IT LOADS CORRECTLY)
     ***********************************************/
    async function fetchBTCChart() {
        try {
            const response = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=7");
            if (!response.ok) throw new Error("API Request Failed");

            const data = await response.json();
            const prices = data.map(entry => parseFloat(entry[4]));
            const labels = data.map((_, index) => `Day ${index + 1}`);

            const canvas = document.getElementById("btc-chart");
            if (!canvas) {
                console.error("BTC Chart canvas not found.");
                return;
            }

            const ctx = canvas.getContext("2d");

            if (btcChart) btcChart.destroy();

            btcChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "BTC 7-Day Price Trend",
                        data: prices,
                        borderColor: "#007BFF",
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { display: true, title: { display: true, text: "Days" } },
                        y: { beginAtZero: false, title: { display: true, text: "Price (USD)" } }
                    }
                }
            });

        } catch (error) {
            console.error("BTC Chart Fetch Error:", error);
        }
    }

    /***********************************************
     * 4) EVENT LISTENERS
     ***********************************************/
    principalInput.addEventListener("input", updateResults);
    btcCollateralInput.addEventListener("input", updateResults);
    ltvSlider.addEventListener("input", updateResults);

    fetchBTCPrice();
    fetchBTCChart();
    setInterval(fetchBTCPrice, 60000);
    setInterval(fetchBTCChart, 60000);
});
