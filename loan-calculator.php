<?php
/*
Plugin Name: BTC Loan Calculator
Plugin URI: https://nahoms.com
Description: A BTC-backed loan calculator that dynamically calculates margin call and liquidation prices based on real-time BTC prices.
Version: 1.2
Author: Nahom
Author URI: https://nahoms.com
License: GPL2
*/

add_shortcode('loan_calculator', 'render_loan_calculator');

function render_loan_calculator() {
    ob_start();
    ?>
    <div id="loan-calculator-container">
        <div id="loan-calculator-content">
            <!-- Left Section: Input Fields -->
            <div id="loan-calculator-inputs">
                <label for="loan-principal">Loan Principal (USD/GBP):</label>
                <input type="text" id="loan-principal" placeholder="Enter loan amount" required>

                <label for="btc-collateral-input">BTC Collateral:</label>
                <input type="text" id="btc-collateral-input" placeholder="Enter BTC collateral">

                <!-- 🔹 Updated LTV Slider (Now 40-60%) -->
                <label for="ltv-slider">LTV (Loan-to-Value):</label>
                <input type="range" id="ltv-slider" min="40" max="60" value="40" step="1" oninput="updateLTVValue(this.value)">
                <span id="ltv-value">40%</span>
                <p>We recommend a 40% LTV to ensure fewer margin calls and a lower chance of LP being met. But offer up to 60% LTV.</p>

                <label for="currency-select">Currency:</label>
                <select id="currency-select">
                    <option value="USD" selected>USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                </select>
            </div>

            <!-- Right Section: Results -->
            <div id="loan-calculator-results">
                <div id="interest-rate-section">
                    <h1>Interest Rate: <span id="interest-rate">14%</span> | APR: <span id="apr">16.21%</span></h1>
                    <h3>BTC Price: <span id="btc-price">Loading...</span></h3>
                    
                    <!-- Ensure BTC Price Chart is included -->
                    <div id="btc-chart-container">
                        <canvas id="btc-chart"></canvas>
                    </div>
                </div>
                <h3>Results</h3>
                <p><strong>30-Day Payment (Interest Only):</strong> <span id="payment">$0.00</span></p>
                <p><strong>Final Payment:</strong> <span id="final-payment">$0.00</span></p>
                <p><strong>Origination Fee:</strong> <span id="origination-fee">$0.00</span></p>
                <p><strong>Finance Charge:</strong> <span id="finance-charge">$0.00</span></p>
                <p><strong>Estimated Loan-to-Value (LTV):</strong> <span id="ltv-value">40%</span></p>
                <p><strong>Estimated First Margin Call Price:</strong> <span id="margin-call">$0.00</span></p>
                <p><strong>Liquidation Price:</strong> <span id="liquidation-price">$0.00</span></p>
                <button id="get-started-button">Get Started</button>
            </div>
        </div>
    </div>

    <!-- Include Chart.js for the BTC Price Chart -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- Enqueue JavaScript and CSS -->
    <script src="<?php echo plugin_dir_url(__FILE__); ?>loan-calculator.js"></script>
    <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__); ?>loan-calculator.css">
    <?php
    return ob_get_clean();
}
?>
