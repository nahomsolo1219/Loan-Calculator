<?php
/*
Plugin Name: BTC Loan Calculator
Plugin URI: https://nahoms.com
Description: A BTC-backed loan calculator that dynamically calculates margin call and liquidation prices based on real-time BTC prices.
Version: 1.3
Author: Nahom
Author URI: https://nahoms.com
License: GPL2
*/

// Enqueue scripts and styles
function enqueue_loan_calculator_scripts() {
    wp_enqueue_script('chart-js', 'https://cdn.jsdelivr.net/npm/chart.js', array(), '4.4.1', true);
    wp_enqueue_script('loan-calculator', plugin_dir_url(__FILE__) . 'loan-calculator.js', array('jquery'), '1.2', true);
    wp_enqueue_style('loan-calculator-css', plugin_dir_url(__FILE__) . 'loan-calculator.css');
    // Localize script with ajaxurl only
    wp_localize_script('loan-calculator', 'ajax_object', array('ajaxurl' => admin_url('admin-ajax.php')));
}
add_action('wp_enqueue_scripts', 'enqueue_loan_calculator_scripts');

// Shortcode to render calculator
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

                <label for="ltv-slider">LTV (Loan-to-Value):</label>
                <input type="range" id="ltv-slider" min="40" max="60" value="40" step="1" oninput="this.nextElementSibling.value = this.value">
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

    <!-- Modal Form -->
    <div id="form-modal" class="modal">
        <div class="modal-content">
            <span id="close-modal" class="close">×</span>
            <h2>Get Your Loan Calculation Details</h2>
            <p class="modal-description">
                Enter your details to receive a detailed breakdown of your loan calculation. <br>
                We’ll also notify you with product updates and financial reports.
            </p>
            <label for="first-name">First Name <span class="required">*</span></label>
            <input type="text" id="first-name" placeholder="Enter your first name" required>
            <label for="email">Email <span class="required">*</span></label>
            <input type="email" id="email" placeholder="Enter your email here" required>
            <div class="checkbox-container">
                <input type="checkbox" id="privacy-policy">
                <label for="privacy-policy">I agree to receive emails about my loan details and product updates <span class="required">*</span></label>
            </div>
            <button id="submit-form">Submit</button>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// AJAX handler for Brevo contact submission
add_action('wp_ajax_add_contact_to_brevo', 'add_contact_to_brevo');
add_action('wp_ajax_nopriv_add_contact_to_brevo', 'add_contact_to_brevo');

function add_contact_to_brevo() {
    if (!defined('BREVO_API_KEY')) {
        error_log('BREVO_API_KEY not defined');
        wp_send_json_error('API key not defined');
        wp_die();
    }

    $api_key = BREVO_API_KEY;

    if (empty($_POST['email']) || empty($_POST['firstName'])) {
        error_log('Missing email or firstName in POST data');
        wp_send_json_error('Required data missing');
        wp_die();
    }

    $contact_data = array(
        'email' => sanitize_email($_POST['email']),
        'attributes' => array(
            'FIRSTNAME' => sanitize_text_field($_POST['firstName'])
        ),
        'listIds' => [3]
    );

    $response = wp_remote_post('https://api.brevo.com/v3/contacts', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'api-key' => $api_key
        ),
        'body' => json_encode($contact_data),
        'method' => 'POST',
        'data_format' => 'body',
        'timeout' => 15
    ));

    if (is_wp_error($response)) {
        error_log('wp_remote_post error: ' . $response->get_error_message());
        wp_send_json_error('API request failed: ' . $response->get_error_message());
    } else {
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        error_log('Brevo API response code: ' . $status_code);
        error_log('Brevo API response body: ' . $body);

        if ($status_code === 201) {
            wp_send_json_success('Contact added successfully');
        } else {
            $decoded = json_decode($body, true);
            $error_message = $decoded['message'] ?? 'Unknown error';
            error_log('Brevo API error: ' . $error_message);
            wp_send_json_error('Failed to add contact: ' . $error_message);
        }
    }
    wp_die();
}
?>
