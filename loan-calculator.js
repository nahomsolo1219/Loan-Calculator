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
    let usdToGbpRate = 0;

    /***********************************************
     * FETCH EXCHANGE RATE (USD to GBP) FROM FRANKFURTER
     ***********************************************/
    async function fetchExchangeRate() {
        try {
            const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=GBP');
            if (!response.ok) throw new Error("Exchange Rate API Failed");
            const data = await response.json();
            usdToGbpRate = data.rates.GBP;
            updateResults(); // Update results when rate is fetched
        } catch (error) {
            console.error("Exchange Rate Fetch Error:", error);
            usdToGbpRate = 0.75; // Fallback rate if API fails (approximate, adjust as needed)
        }
    }

    /***********************************************
     * FETCH REAL-TIME BTC PRICE FROM BINANCE
     ***********************************************/
    async function fetchBTCPrice() {
        try {
            const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
            if (!response.ok) throw new Error("API Request Failed");
            
            const data = await response.json();
            btcPriceUSD = parseFloat(data.price);

            updateBTCPriceDisplay();
            updateResults();
            fetchBTCChart();
        } catch (error) {
            btcPriceDisplay.textContent = "⚠️ Error Fetching Price";
            console.error("BTC Price Fetch Error:", error);
        }
    }

    function updateBTCPriceDisplay() {
        const currency = currencySelect.value;
        const price = currency === "GBP" && usdToGbpRate ? btcPriceUSD * usdToGbpRate : btcPriceUSD;
        btcPriceDisplay.textContent = btcPriceUSD > 0 ? `${currency === "GBP" ? "£" : "$"}${formatNumber(price)}` : "⚠️ No Price Data";
    }

    function getBTCPrice() {
        return currencySelect.value === "GBP" && usdToGbpRate ? btcPriceUSD * usdToGbpRate : btcPriceUSD;
    }

    function formatNumber(value) {
        return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /***********************************************
     * UPDATE CALCULATIONS
     ***********************************************/
    function updateResults() {
        const btcPrice = getBTCPrice();
        const ltv = parseFloat(ltvSlider.value);
        const liqLTVRate = Math.max(ltv + 10, 60);
        const mcLTV = (ltv + liqLTVRate) / 2;
        const currency = currencySelect.value;
        const symbol = currency === "GBP" ? "£" : "$";

        ltvValueDisplay.textContent = `${ltv}%`;

        let principal = parseFloat(principalInput.value.replace(/,/g, "")) || 0;
        let collateral = parseFloat(btcCollateralInput.value.replace(/,/g, "")) || 0;

        // Convert principal to USD if entered in GBP
        if (currency === "GBP" && usdToGbpRate) {
            principal = principal / usdToGbpRate; // Convert GBP to USD for internal calculations
        }

        if (principal <= 0 && collateral <= 0) {
            paymentDisplay.textContent = `${symbol}0.00`;
            finalPaymentDisplay.textContent = `${symbol}0.00`;
            originationFeeDisplay.textContent = `${symbol}0.00`;
            financeChargeDisplay.textContent = `${symbol}0.00`;
            marginCallDisplay.textContent = `${symbol}0.00`;
            liquidationPriceDisplay.textContent = `${symbol}0.00`;
            aprDisplay.textContent = "0.00%";
            return;
        }

        if (principal > 0 && btcPrice > 0 && ltv > 0) {
            collateral = principal / (btcPrice * (ltv / 100));
            btcCollateralInput.value = collateral.toFixed(6);
        } else if (collateral > 0 && btcPrice > 0 && ltv > 0) {
            principal = collateral * btcPrice * (ltv / 100);
            principalInput.value = formatNumber(currency === "GBP" && usdToGbpRate ? principal * usdToGbpRate : principal);
        }

        const thirtyDayPayment = principal * (interestRate / 365) * 30;
        const originationFee = principal * 0.02;
        const financeCharge = (thirtyDayPayment * 12) + originationFee;
        const finalPayment = principal + thirtyDayPayment;
        const marginCallPrice = (ltv / mcLTV) * btcPrice;
        const liquidationPrice = (ltv / liqLTVRate) * btcPrice;
        const apr = (financeCharge / principal) * 100;

        // Convert to GBP if selected
        const conversionFactor = currency === "GBP" && usdToGbpRate ? usdToGbpRate : 1;
        paymentDisplay.textContent = `${symbol}${formatNumber(thirtyDayPayment * conversionFactor)}`;
        finalPaymentDisplay.textContent = `${symbol}${formatNumber(finalPayment * conversionFactor)}`;
        originationFeeDisplay.textContent = `${symbol}${formatNumber(originationFee * conversionFactor)}`;
        financeChargeDisplay.textContent = `${symbol}${formatNumber(financeCharge * conversionFactor)}`;
        marginCallDisplay.textContent = `${symbol}${formatNumber(marginCallPrice)}`;
        liquidationPriceDisplay.textContent = `${symbol}${formatNumber(liquidationPrice)}`;
        aprDisplay.textContent = formatNumber(apr) + "%";
    }

    /***********************************************
     * BTC PRICE CHART
     ***********************************************/
    async function fetchBTCChart() {
        try {
            const response = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=7");
            if (!response.ok) throw new Error("API Request Failed");

            const data = await response.json();
            let prices = data.map(entry => parseFloat(entry[4]));
            if (currencySelect.value === "GBP" && usdToGbpRate) {
                prices = prices.map(price => price * usdToGbpRate);
            }
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
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: true, title: { display: true, text: "Days" } },
                        y: { 
                            beginAtZero: false, 
                            title: { display: true, text: currencySelect.value === "GBP" ? "Price (GBP)" : "Price (USD)" } 
                        }
                    }
                }
            });
        } catch (error) {
            console.error("BTC Chart Fetch Error:", error);
        }
    }

    /***********************************************
     * EVENT LISTENERS
     ***********************************************/
    principalInput.addEventListener("input", updateResults);
    btcCollateralInput.addEventListener("input", updateResults);
    ltvSlider.addEventListener("input", updateResults);
    currencySelect.addEventListener("change", () => {
        updateBTCPriceDisplay();
        updateResults();
        fetchBTCChart();
    });

    const getStartedButton = document.getElementById("get-started-button");
    const modal = document.getElementById("form-modal");
    const closeBtn = document.getElementById("close-modal");

    getStartedButton.addEventListener("click", () => {
        modal.classList.add('show');
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove('show');
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });

    document.getElementById("submit-form").addEventListener("click", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("first-name").value;
        const email = document.getElementById("email").value;
        const privacyPolicy = document.getElementById("privacy-policy").checked;

        if (!firstName || !email || !privacyPolicy) {
            alert("Please fill in all required fields and agree to the privacy policy.");
            return;
        }

        try {
            const response = await fetch(ajax_object.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'action': 'add_contact_to_brevo',
                    'email': email,
                    'firstName': firstName
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Contact added successfully');
                const modalContent = document.querySelector('.modal-content');
                modalContent.innerHTML = `
                    <span id="close-modal" class="close">×</span>
                    <h2>Thank You!</h2>
                    <p>Your details have been successfully submitted. We'll be in touch soon with your loan details.</p>
                `;
                document.getElementById("close-modal").addEventListener("click", () => {
                    modal.classList.remove('show');
                });
            } else {
                console.error('Failed to add contact:', result.data);
                alert('Error: ' + result.data);
            }
        } catch (error) {
            console.error('AJAX request failed:', error);
            alert('An error occurred while submitting your details. Please try again.');
        }
    });

    fetchExchangeRate(); // Fetch exchange rate first
    fetchBTCPrice();
    fetchBTCChart();
    setInterval(fetchBTCPrice, 60000);
    setInterval(fetchBTCChart, 60000);
    setInterval(fetchExchangeRate, 3600000); // Update exchange rate hourly
});
