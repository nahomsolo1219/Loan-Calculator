<?php
/*
Plugin Name: Loan Calculator
Description: A custom plugin to display a loan calculator with LTV slider and dynamic BTC price fetching.
Version: 1.0
Author: Nahom
*/
?>

<?php

// Register the shortcode
add_shortcode('loan_calculator', 'render_loan_calculator');

// Function to render the calculator
function render_loan_calculator() {
    ob_start(); // Start output buffering
    ?>
    <div id="loan-calculator">
        <form>
            <label for="loan-principal">Loan Principal (USD):</label>
            <input type="number" id="loan-principal" placeholder="Enter loan amount" required>

            <label for="ltv-slider">LTV (Loan-to-Value):</label>
            <input type="range" id="ltv-slider" min="40" max="70" value="40" step="1" oninput="updateLTVValue(this.value)">
            <span id="ltv-value">40%</span>
            <p>We recommend a 40% LTV to ensure less margin calls and less chance of LP being met. But offer up to 70% LTV.</p>

            <label for="btc-price">BTC Price (USD):</label>
            <span id="btc-price">Loading...</span>

            <div id="results">
                <p><strong>BTC Collateral:</strong> <span id="btc-collateral"></span></p>
                <p><strong>30-Day Payment (Interest Only):</strong> <span id="payment"></span></p>
                <p><strong>Final Payment:</strong> <span id="final-payment"></span></p>
                <p><strong>Origination Fee:</strong> <span id="origination-fee"></span></p>
                <p><strong>Finance Charge:</strong> <span id="finance-charge"></span></p>
                <p><strong>Margin Call Price:</strong> <span id="margin-call"></span></p>
                <p><strong>Liquidation Price:</strong> <span id="liquidation-price"></span></p>
            </div>
        </form>
    </div>
    <script src="<?php echo plugin_dir_url(__FILE__); ?>loan-calculator.js"></script>
    <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__); ?>loan-calculator.css">
    <?php
    return ob_get_clean(); // Return the buffered content
}
